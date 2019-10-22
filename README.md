# JavaScriptAnimations

Lightweight and versatile JavaScript animations library.

## Getting Started

To use this library, simply download the [animations.js](animations.js) file from this repository and plug it into your project.

## Deployment

### Running an animation

This library relies solely on JavaScript for its animations, and operates by routing all animations through a global `Animator` object. Each animation is also represented as a JavaScript class.

To run an animation simply queue an Animation object with the `Animator.queue(anim, delay)` method:

```js
Animator.queue(new Fade(node, 1, 0.1))       // queues a Fade animation to run immediately
Animator.queue(new Fade(node, 0, -0.1), 300) // queues a Fade animation to run after 300ms
```

Besides the delay parameter in the `Animator.queue(anim, delay)` method, all animations are removed from any explicit time intervals. Instead, an animation's repeat sequence is called recursively through the `window.requestAnimationFrame(func)` method. For more information about this method see [here](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame).

### The Animator object

Importantly, animations are organized by the Animator object in the following ways:
* All animations are tagged by the id of the node that is being animated (passed to super constructor; see below) and the name of the animation.
* All running animations are logged in the `animations` global dictionary with the key `id,animName` and value `animation request id` (returned by requestAnimationFrame()). To see a list of currently running animations, simply log this dictionary (e.g. `console.log(animations)`).
* If an animation is queued that is already currently running (according to the id+animation-name combo) the currently running animation is canceled and the queued animation takes its place. In this way, animations never enter infinite loops and users are not forced to wait until the end of an animation (in the case that one is triggered by user input).
* Multiple *different* animations, however, *can* be run on the same element.
* Animations may be canceled at any time using the `Animator.cancel(ids, animation)` or `Animator.cancelAll(id)` methods. For documentation of these methods, see the source code.
* To check for currently running animations for an element, the `Animator.check(id)` method may be used.

### Defining a custom animation

This library comes with a few predefined Animation classes, but was primarily built for custom animations. To create your own animation, declare a class with the following structure:

```js
class MyAnimation extends Animation {       // Animation classes must extend from the Animation base                    
    constructor(node, ...) {                // class or a child class of Animation
        super(node)                         // Must call super with the node that is being animated. This 
                                            // node may be purely symbolic, but the Animator object requires 
                                            // a node with a valid id to attach to the running animation
        // perform whatever
        // necessary initializations
    }
    
    anim() {                                // Animation classes must implement an anim() method, which will
        // perform one animation step       // be repeatedly called by window.requestAnimationFrame(func)
    }                                       // The anim() method should return false if it should be called again
                                            // If the animation is complete, return true from the anim() method
    ... // define any other methods
}
```


To get an idea of what this construction may look like, take a look at the Fade animation below:


```js
/**
 * A fade animation.
 */
class Fade extends Animation {                                                                                                               /**
     * Constructs a new Fade animation.
     *
     * @param node the node which to animate, must have an id
     * @param fadeTo the opacity value to which to fade
     * @param step the increment of opacity value for each animation frame,
     * controls the speed of the animation (e.g. 0.1), can be negative or positive
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
        } catch (e) {console.error(e)}                                                                                                           if (r) {
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
```

For more inspiration and understanding of the Animation class structure, see more animation examples in [animations.js](animations.js).

While not extremely robust or comprehensive, this library emphasizes versatility. Animations may be as complex or simple as you like and are well-maintained by the `Animator` object.

## Authors

* **Alexander Luiz Costa** - *Initial work* - [alexcostaluiz](https://github.com/alexcostaluiz)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
