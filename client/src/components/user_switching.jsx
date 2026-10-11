import React, { useRef } from "react";
import "../styles/user_switching.css";

function UserSwitching(props) {
  let group = props.group;
  let selectRef = useRef();

  function handleChange() {
    // Get the selected user
    let selectedUser = group.usersMinusActive.users.filter((user) => {
      return user.username === selectRef.current.value;
    });

    // Send selected user index and username to parent component
    props.onClick(
      selectRef.current.value,
      group.usersMinusActive.users.indexOf(selectedUser[0])
    );
  }

  return (
    <section className="user-switching-container">
      <svg className="user-switching-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4" fill="currentColor" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2H4Z" fill="currentColor" />
      </svg>
      <select name="users" ref={selectRef} onChange={handleChange}>
        {group.users.map((user) => (
          <option key={user.username}>{user.username}</option>
        ))}
      </select>
    </section>
  );
}

export default UserSwitching;
