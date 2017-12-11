"use strict";

/**
 * Collection of static methods related to the GroupButton UI element.
 * Initializes every accessible GroupButton UI element with according
 * onclick methods.
 */
const ButtonGroup = (function() {
  function select(event) {
    const  elt = event.currentTarget;
    if (elt.className.includes(" selected")){
      elt.className = elt.className.replace(/ selected/g, "");
    } else {
      elt.className += " selected";
    }
  }

  function selectUnique(event) {
    const  elt = event.currentTarget;
    const siblings = elt.parentElement.childNodes;

    for (let iButton = 0; iButton < siblings.length; ++iButton) {
      const sibling = siblings[iButton];
        if (sibling.tagName == 'BUTTON' && !sibling.disabled) {
          sibling.className = sibling.className.replace(/ selected/g, "");
        }
    }

    elt.className += " selected";
  }

  function initialize() {
    const buttonGroups = document.getElementsByClassName("button-group");
    for (let iG = 0; iG < buttonGroups.length; ++iG) {
      const group = buttonGroups[iG];
      const func = (group.className.includes(" unique")) ? selectUnique : select;
      
      const children = group.childNodes;
      for (let iC = 0 ; iC < children.length ; ++iC) {
        const child = children[iC];
        if (child.tagName === 'BUTTON' && !child.disabled) {
          child.addEventListener("click", func);
        }
      }     
    }
  }
  
  initialize();
  
  let visible = {
    initialize: initialize,
  };
  
  return Object.freeze(visible);
})();