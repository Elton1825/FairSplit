import React, { useState, useRef, useEffect } from "react";
import "../styles/add_user.css";

function AddUser(props) {
  const isEmptyState = props.variant === "empty";

  // Reactive variables to store element classes, allowing for dynamic styling
  let [transitionClass, setTransitionClass] = useState("add-user-plus");
  let [crossClass, setCrossClass] = useState("add-user-plus");
  let [picClass, setPicClass] = useState("add-user-pic");
  let [inputClass, setInputClass] = useState("add-user-input");
  let [inputValue, setInputValue] = useState("");

  // Create reference to input element to add focus when rendered
  let inputRef = useRef(null);
  const isExpanded = transitionClass.includes("clicked");

  useEffect(() => {
    if (isEmptyState && isExpanded) {
      inputRef.current.focus();
    }
  }, [isEmptyState, isExpanded, inputRef]);

  function handleChange(event) {
    // Update the state with the new value
    setInputValue(event.target.value);
    const inputLen = event.target.value.length;

    // Alter styling based on state of input by adding/removing classes
    if (inputLen > 0) {
      setCrossClass("");
    } else if (!inputLen) {
      setCrossClass("cross-rotate");
    }
  }

  // Handle dynamic styling when the user wants to add a user
  async function addTransformClass() {
    // Removes classes when user is added or the user cancels the action
    if (transitionClass.includes("clicked")) {
      if (inputValue.length > 0) {
        try {
          const addSucceeded = await props.onClick(inputValue);
          if (addSucceeded === false) {
            return;
          }
        } catch (error) {
          console.error(error);
          return;
        }

        setInputValue("");
      } else if (isEmptyState) {
        return;
      }
      setInputClass("add-user-input");
      setTransitionClass("add-user-plus");
      setCrossClass("add-user-plus");
      setPicClass("add-user-pic");
    } else {
      // Add classes that will animate the add user button
      setTransitionClass(
        transitionClass + " add-user-plus-clicked x-rotate y-rotate",
      );

      // Add class that will animate the cross SVG icon on the add user button
      setCrossClass("cross-rotate");
      // Add classes that will fade in the profile picture and input
      setPicClass(picClass + " add-user-pic-clicked");
      setInputClass(inputClass + " add-user-input-clicked");
      // Add focus to the input element
      inputRef.current.focus();
    }
  }

  function cancelAddMember() {
    setInputValue("");
    setInputClass("add-user-input");
    setTransitionClass("add-user-plus");
    setCrossClass("add-user-plus");
    setPicClass("add-user-pic");
  }

  if (isEmptyState && isExpanded) {
    return (
      <section className="group-members-container group-members-empty add-member-card">
        <div className="add-member-form-view">
          <div className="add-member-icon" aria-hidden="true">
            <svg viewBox="0 0 120 90">
              <circle cx="42" cy="31" r="12" fill="#2563EB" />
              <circle cx="78" cy="31" r="12" fill="#2563EB" />
              <path
                d="M25 68C25 57.5063 33.5063 49 44 49H52C62.4937 49 71 57.5063 71 68V72H25V68Z"
                fill="#2563EB"
              />
              <path
                d="M55 68C55 57.5063 63.5063 49 74 49H82C92.4937 49 101 57.5063 101 68V72H55V68Z"
                fill="#DBEAFE"
              />
              <circle cx="88" cy="38" r="10" fill="#DBEAFE" />
            </svg>
          </div>
          <h1 className="add-member-title">Add Group Member</h1>
          <p className="add-member-description">
            Add new member to your group
            <br />
            to start splitting expense together
          </p>
          <div className="add-member-form">
            <label className="add-member-label" htmlFor="member-name">
              Member Name
            </label>
            <div className="add-member-input-wrap">
              <svg
                className="add-member-input-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" fill="currentColor" />
                <path
                  d="M4 21v-2a8 8 0 0 1 16 0v2H4Z"
                  fill="currentColor"
                />
              </svg>
              <input
                id="member-name"
                value={inputValue}
                onChange={handleChange}
                ref={inputRef}
                className="add-user-input add-member-name-input"
                type="text"
                placeholder="Enter your member name"
              />
            </div>
            <div className="add-member-actions">
              <button
                type="button"
                className="add-member-submit"
                onClick={addTransformClass}
              >
                <span aria-hidden="true">+</span>
                Add Member
              </button>
              <button
                type="button"
                className="add-member-cancel"
                onClick={cancelAddMember}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isEmptyState) {
    return (
      <section className="group-members-container group-members-empty">
        <h1 className="group-members-title">Group Members</h1>
        <div className="group-members-empty-state">
          <div className="empty-members-illustration" aria-hidden="true">
            <svg viewBox="0 0 120 90">
              <rect width="120" height="90" rx="18" fill="#EFF6FF" />
              <circle cx="42" cy="31" r="12" fill="#2563EB" />
              <circle cx="78" cy="31" r="12" fill="#2563EB" />
              <path
                d="M25 68C25 57.5063 33.5063 49 44 49H52C62.4937 49 71 57.5063 71 68V72H25V68Z"
                fill="#2563EB"
              />
              <path
                d="M55 68C55 57.5063 63.5063 49 74 49H82C92.4937 49 101 57.5063 101 68V72H55V68Z"
                fill="#DBEAFE"
              />
              <circle cx="88" cy="38" r="10" fill="#DBEAFE" />
            </svg>
          </div>
          <h2 className="empty-members-title">Add people to your group</h2>
          <p className="empty-members-text">
            Start by adding group members
            <br />
            to split expense together
          </p>
          <div className="empty-add-user-wrapper">
            <div className="add-user-container add-user-container-empty">
              <input
                value={inputValue}
                onChange={handleChange}
                ref={inputRef}
                className="add-user-input add-user-input-empty"
                type="text"
              />
              <button
                type="button"
                aria-label="Add user"
                className={`${transitionClass} add-user-plus-empty`}
                onClick={addTransformClass}
              >
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <g id="Frame 1">
                    <g id="cross" className={crossClass}>
                      <line
                        id="y-line"
                        x1="50.5"
                        y1="15"
                        x2="50.5"
                        y2="86"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <line
                        id="x-line"
                        x1="14"
                        y1="49.5"
                        x2="85"
                        y2="49.5"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                    </g>
                  </g>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div
      className={
        isEmptyState
          ? "add-user-container add-user-container-empty"
          : "add-user-container"
      }
    >
      <div className={picClass}></div>
      <input
        value={inputValue}
        onChange={handleChange}
        ref={inputRef}
        className={
          isEmptyState ? `${inputClass} add-user-input-empty` : inputClass
        }
        type="text"
        placeholder="Enter member name"
      ></input>
      <div
        aria-label="Add user"
        className={isEmptyState ? `${transitionClass} add-user-plus-empty` : transitionClass}
        onClick={addTransformClass}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            addTransformClass();
          }
        }}
        role="button"
        tabIndex="0"
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="Frame 1">
            <g id="cross" className={crossClass}>
              <line
                id="y-line"
                x1="50.5"
                y1="15"
                x2="50.5"
                y2="86"
                stroke="currentColor"
                strokeWidth="4"
              />
              <line
                id="x-line"
                x1="14"
                y1="49.5"
                x2="85"
                y2="49.5"
                stroke="currentColor"
                strokeWidth="4"
              />
            </g>
          </g>
        </svg>
        {!isEmptyState && <span className="add-user-action-label">Add Member</span>}
      </div>
    </div>
  );
}

export default AddUser;
