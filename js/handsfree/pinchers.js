/**
 * Adds pinch helpers
 */
const handsfree = window.handsfree
import {TweenMax} from 'gsap'

handsfree.use('pinchers', {
  models: 'hands',

  // Number of frames the current element is the same as the last
  numFramesFocused: [[0, 0, 0, 0,], [0, 0, 0, 0]],

  // Whether the fingers are touching
  thresholdMet: [[0, 0, 0, 0,], [0, 0, 0, 0]],
  framesSinceLastGrab: [[0, 0, 0, 0,], [0, 0, 0, 0]],

  // The original grab point for each finger
  origPinch: [
    [{x: 0, y: 0},{x: 0, y: 0},{x: 0, y: 0},{x: 0, y: 0}],
    [{x: 0, y: 0},{x: 0, y: 0},{x: 0, y: 0},{x: 0, y: 0}]
  ],
  curPinch: [
    [{x: 0, y: 0},{x: 0, y: 0},{x: 0, y: 0},{x: 0, y: 0}],
    [{x: 0, y: 0},{x: 0, y: 0},{x: 0, y: 0},{x: 0, y: 0}]
  ],

  // The tweened scrollTop, used to smoothen out scroll
  // [[leftHand], [rightHand]]
  tween: [
    [{x: 0, y: 0},{x: 0, y: 0},{x: 0, y: 0},{x: 0, y: 0}],
    [{x: 0, y: 0},{x: 0, y: 0},{x: 0, y: 0},{x: 0, y: 0}]
  ],

  // Number of frames that has passed since the last grab
  numFramesFocused: [[0, 0, 0, 0,], [0, 0, 0, 0]],

  // Number of frames mouse has been downed
  mouseDowned: 0,
  // Is the mouse up?
  mouseUp: false,
  // Whether one of the morph confidences have been met
  mouseThresholdMet: false,
  
  config: {
    // Number of frames over the same element before activating that element
    framesToFocus: 10,

    // Number of pixels the middle and thumb tips must be near each other to drag
    threshold: 50,

    // Number of frames where a hold is not registered before releasing a drag
    numThresholdErrorFrames: 5,

    maxMouseDownedFrames: 1
  },

  onUse () {
    this.$target = window
  },

  /**
   * Scroll the page when the cursor goes above/below the threshold
   */
  onFrame ({hands}) {
    if (!hands.multiHandLandmarks) return

    const height = this.handsfree.debug.$canvas.hands.height
    const leftVisible = hands.multiHandedness.some(hand => hand.label === 'Right')
    const rightVisible = hands.multiHandedness.some(hand => hand.label === 'Left')
    const field = window.field
    
    // Detect if the threshold for clicking is met with specific morphs
    for (let n = 0; n < hands.multiHandLandmarks.length; n++) {
      // Set the hand index
      let hand = hands.multiHandedness[n].label === 'Right' ? 0 : 1
      
      for (let finger = 0; finger < 4; finger++) {
        // Check if fingers are touching
        const a = hands.multiHandLandmarks[n][4].x - hands.multiHandLandmarks[n][window.fingertipIndex[finger]].x
        const b = hands.multiHandLandmarks[n][4].y - hands.multiHandLandmarks[n][window.fingertipIndex[finger]].y
        const c = Math.sqrt(a*a + b*b) * height
        const thresholdMet = this.thresholdMet[hand][finger] = c < this.config.threshold

        if (thresholdMet) {
          // Set the current pinch
          this.curPinch[hand][finger] = hands.multiHandLandmarks[n][4]
          
          // Store the original pinch
          if (this.framesSinceLastGrab[hand][finger] > this.config.numThresholdErrorFrames) {
            this.origPinch[hand][finger] = hands.multiHandLandmarks[n][4]
            TweenMax.killTweensOf(this.tween[hand][finger])
          }
          this.framesSinceLastGrab[hand][finger] = 0
        }
        ++this.framesSinceLastGrab[hand][finger]
      }
    }

    // Update the bias with left index
    if (leftVisible && this.thresholdMet[0][0]) {
      field.simBias.value.x = (this.curPinch[0][0].x - this.origPinch[0][0].x) * 2 - .5
      field.simBias.value.y = .5 - (this.curPinch[0][0].y - this.origPinch[0][0].y) * 2
    }
    
    // Update the Hue with left pinky
    if (leftVisible && this.thresholdMet[0][3]) {
      field.simBias.value.x = 0
      field.simBias.value.y = 0
    }

    // Clear the board with both pinkies
    if (leftVisible && this.thresholdMet[0][3] && rightVisible && this.thresholdMet[1][3]) {
      field.clear.controller.button.emitter.observers_.click[0].handler()
    }

    this.checkClick(rightVisible)
  },

  /**
   * Check if we are "mouse clicking"
   */
  checkClick (rightVisible) {
    // Click
    if (rightVisible && this.thresholdMet[1][0]) {
      this.mouseDowned++
    } else {
      this.mouseUp = this.mouseDowned
      this.mouseDowned = 0
    }
        
    // Set the state
    let state = ''
    if (this.mouseDowned > 0 && this.mouseDowned <= this.config.maxMouseDownedFrames) {
      state = 'mousedown'
    } else if (this.mouseDowned > this.config.maxMouseDownedFrames) {
      state = 'mousedrag'
    } else if (this.mouseUp) {
      state = 'mouseup'
    }

    if (state === 'mousedown') {
      window.$canvas.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: this.curPinch[1][0].x,
          clientY: this.curPinch[1][0].y,
        })
      )
    } else if (state === 'mouseup') {
      window.$canvas.dispatchEvent(
        new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: this.curPinch[1][0].x,
          clientY: this.curPinch[1][0].y,
        })
      )
    }
  }
})
