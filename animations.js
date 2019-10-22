/**
 * animations.js
 * 10/17/2019
 * An extremely lightweight javascript animations library. Not comprehensive
 * by any means, meant to be customized and built on.
 *
 * @author Alexander Luiz Costa
 * @version 1.0.0
 */

// holds a collection of currently running animations
var animations = {}

/**
 * Registers and deregisters animations.
 */
class Animator {
    constructor() {}
    
    /**
     * Queues the specified animation with window.requestAnimationFrame.
     * 
     * @param a the animation to queue, must be derived from Animation class
     */
    queue(a, delay) {
	if (delay !== undefined) {
	    setTimeout(() => {
		this.queue(a)
	    }, delay)
	} else {
	    if (a instanceof Animation) {
		this.cancel(a.ids, a.constructor)
		var i = window.requestAnimationFrame(a.run)
		animations[[a.node.id, a.constructor.name]] = i
	    }
	    else throw "Error: specified animation must inherit from Animation class"
	}
    } // queue

    /* 
     * Cancels an animation if one is currently running under the specified id.
     *
     * @param ids an id or array of ids for which to cancel animation a
     * @param a the animation class of the animation to cancel (e.g. if you
     * are trying to cancel a CrossFade, simply pass "CrossFade" as a)
     */
    cancel(ids, a) {
	if (typeof ids === "string") {
	    window.cancelAnimationFrame(animations[[ids, a.name]])
	    delete animations[[ids, a.name]]
	} else {
	    for (var i = 0; i < ids.length; i++) {
		var id = ids[i]
		window.cancelAnimationFrame(animations[[id, a.name]])
		delete animations[[id, a.name]]
	    }
	}
    } // cancel

    /**
     * Cancels all animations running on the specified id.
     *
     * @param the id of the object of which to cancel all animations
     */
    cancelAll(id) {
	for (var key in animations) {
	    if (key.includes(id)) {
		window.cancelAnimationFrame(animations[key])
		delete animations[key]
	    }
	}
    } // cancelAll

    /**
     * Returns whether any animations are running on the object
     * with the specified id.
     * 
     * @param id the id of the object on which to check for animations
     * @returns true if any animations are running on the object; false
     * otherwise
     */
    check(id) {
	var out = false
	for (var key in animations) {
	    if (key.includes(id)) {
		out = true
	    }
	}
	return out
    } // check
    
} // Animator

// global Animator
Animator = new Animator()

/**
 * Abstract base animation class. Should not be instantiated.
 *
 * Derived animation classes, must implement an "anim" method
 * which will be run recursively every animation frame. "anim" should
 * have some stopping condition. Derived classes should also call
 * super(node) in their constructor with node being the dom element
 * which is being animated. (node can be figurative, meaning it doesn't
 * have to be the only element being animated or even animated at all, 
 * but one element with an ID is needed to save the animation in the queue)
 *
 * NOTE: "node" MUST HAVE A UNIQUE ID
 */
class Animation {
    constructor(node) {
	if (this.constructor === Animation) {
	    throw new TypeError('Abstract class "Animation" cannot be instantiated directly.')
	}
	
	if (this.anim === undefined) {
	    throw new TypeError('Class extending "Animation" must implement anim method.')
	}
	
	if (node.id === "") {
	    throw new TypeError('DOM element "node" must have an explicitly assigned id.')
	}
	
	this.node = node
	this.ids = [node.id]
	this.run = this.animWrapper.bind(this)
    } // constructor
    
    animWrapper() {
	var result = this.anim()
	if (result) {
	    Animator.cancel(this.ids, this.constructor)
	} else {
	    var i = window.requestAnimationFrame(() => {
		this.run()
	    })
	    animations[[this.node.id, this.constructor.name]] = i
	}
    }
} // Animation

/**
 * A fade animation.
 */
class Fade extends Animation {
    /**
     * Constructs a new Fade animation.
     *
     * @param node the node which to animate, must have an id
     * @param fadeTo the opacity value to which to fade
     * @param step the increment of opacity value for each animation frame,
     * controls the speed of the animation (e.g. 0.1), can be negativeo or positive
     */
    constructor(node, fadeTo, step) {
	super(node)
	this.fadeTo = fadeTo
	this.step = step
    } // constructor

    /**
     * The animation function to be recursively called every animation frame.
     *
     * @return true if animation is finished; false otherwise
     */
    anim() {
	var r = true
	try {
	    r = this.stepFade(this.node, this.fadeTo, this.step)
	} catch (e) {console.error(e)}
	if (r) {
	    return true
	}
    } // anim
    
    /**
     * A helper method to increase or decrease node's opacity by step
     *
     * Note: not using this.node, this.fadeTo, etc. and passing arguments
     * allows different fades to be called by the same animation, see CrossFade
     *
     * @param node the node to manipulate
     * @param fadeTo the opacity value to which to fade
     * @param step the increment of opacity value
     * @return true if node has reached fadeTo; false otherwise
     */
    stepFade(node, fadeTo, step) {
	var opacity = +node.style.opacity
	
	if (fadeTo < opacity && step > 0 || fadeTo > opacity && step < 0) {
	    throw "Error: step is incompatible with fadeTo (infinite loop)."
	}
	
	if (opacity == fadeTo) return true
	
	var newOpacity = opacity + step
	node.style.opacity = (step < 0 && newOpacity < fadeTo || step > 0 && newOpacity > fadeTo) ? fadeTo : newOpacity
	return false
    } // stepFade
} // Fade

/**
 * A crossfade animation.
 */
class CrossFade extends Fade {
    /**
     * Constructs a new CrossFade animation.
     *
     * @param node the node to fade out
     * @param onode the node to fade in
     * @param fadeTo the oapcity value to which to fade onode
     * @param step the increment of opacity value for each animation frame,
     * controls the speed of the animation (e.g. 0.1), can be negative or positive
     */
    constructor(node, onode, fadeTo, step) {
	super(node, fadeTo, step)
	this.onode = onode
	this.flip = false
	this.ids.push(onode.id)
    } // constructor

    /**
     * The animation function to be called recursively every animation frame.
     */
    anim() {
	if (!this.flip) {
	    var r = true
	    try {
		r = this.stepFade(this.node, 0, -this.step)
	    } catch (e) {console.error(e)}
	    if (r) {
		this.flip = true
		this.node.style.display = "none"
		this.onode.style.display = "block"
		var temp = this.node
		this.node = this.onode
		this.onode = temp
	    }
	} else {
	    var r = true
	    try {
		r = this.stepFade(this.node, this.fadeTo, this.step)
	    } catch (e) {console.error(e)}
	    if (r) {
		return true
	    }
	}
    } // anim
} // CrossFade

/**
 * A fade animation with a translation.
 */ 
class FadeShift extends Fade {
    /**
     * Constructs a new FadeShift animation.
     *
     * @param node the node which to animate, must have an id
     * @param fadeTo the opacity value to which to fade
     * @param fadeStep the increment of opacity value for each animation frame,
     * controls the speed of the fade (e.g. 0.1), can be negative or positive
     * @param shiftAxis the axis on which to translate node; "x" for left-right
     * translations, "y" for up-down translations; "y" is default
     * @param shiftFrom the starting translation value
     * @param shiftTo the destination translation value
     * @param shiftStep the increment of translation value for each animation frame,
     * controls the speed of the shift, can be negative or positive; by default
     * this value will be calculated to end the shift at the same time the fade ends,
     * only supply a value if you wish for the fade and shift to end at different times
     */
    constructor(node, fadeTo, fadeStep, shiftAxis, shiftFrom, shiftTo, shiftStep) {
	super(node, fadeTo, fadeStep)
	this.shiftFrom = shiftFrom
	this.shiftTo = shiftTo
	this.shiftStep = (shiftStep === undefined) ? this.computeShiftStep() : shiftStep
	this.shiftAxis = (/[XxYy]/g.test(shiftAxis) && shiftAxis.length == 1) ? shiftAxis.toUpperCase() : "Y"
	this.shiftCurr = shiftFrom
	this.node.style.transform = "translate" + this.shiftAxis + "(" + this.shiftCurr + "px)"
    } // constructor
    
    /**
     * The animation function to be called recursively every animation frame.
     */
    anim() {
	var r = true
	var s = true
	try {
	    r = this.stepFade(this.node, this.fadeTo, this.step)
	    s = this.stepShift(this.node, this.shiftAxis, this.shiftTo, this.shiftStep)
	} catch (e) {console.error(e)}
	if (r && s) {
	    return true
	}
    } // anim

    /** 
     * A helper method to compute a shiftStep to match the timing of
     * the fade animation
     *
     * @return a shiftStep that matches the fade timing
     */
    computeShiftStep() {
	var currOpacity = +this.node.style.opacity
	var diff = this.fadeTo - currOpacity
	var numiters = diff / this.step
	
	return (this.shiftTo - this.shiftFrom) / numiters
    } // computeShiftStep
    
    /**
     * A helper method to translate a node by step
     *
     * @param node the node to manipulate
     * @param axis the axis on which to translate node
     * @param shiftTo the destination translation value
     * @param step the increment of translation
     * @return true if node has reached its destination; false otherwise
     */
    stepShift(node, axis, shiftTo, step) {
	var curr = this.shiftCurr
	
	if (shiftTo < curr && step > 0 || shiftTo > curr && step < 0) {
	    throw "Error: step is incompatible with fadeTo (infinite loop)."
	}
	
	if (curr == shiftTo) return true
	
	var newShift = curr + step * Math.abs((shiftTo - curr) / (shiftTo - this.shiftFrom)) + step / 10
	var newShift = (step < 0 && newShift < shiftTo || step > 0 && newShift > shiftTo) ? shiftTo : newShift
	node.style.transform = "translate" + axis + "(" + newShift + "px)"
	this.shiftCurr = newShift
	return false
    } // stepFade
 } // FadeShift
