import React, { useState, createRef } from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { apiPath } from "../api";
import "../styles/group_expenses.css";
import Expense from "./expense";
import AddExpense from "./add_expense";

function GroupExpenses(props) {
  // Array of expenses & debts
  let expenses = props.group.expenses;
  const outstandingBalance = props.group.usersMinusActive.outstandingBalance;
  const balanceStatus =
    outstandingBalance > 0
      ? "negative"
      : outstandingBalance < 0
        ? "positive"
        : "neutral";

  // Refs for transitions
  let containerRef = createRef();

  // Reactive states for adding styles
  let [clearForm, setClearForm] = useState(false);

  // Add expense data to db
  async function addExpense(expense) {
    // Call route to add expense to db
    let validExpense = await fetch(apiPath("/expenses"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expense),
    });

    let response = await validExpense.json();

    if (validExpense.ok) {
      // Tell parent component to get latest debts
      props.onClick();
      // Add expense to array of expenses
      expenses.unshift(response);
    } else {
      // Display error message
      console.error(response.error);
    }
    // Clear form
    setClearForm(true);
  }

  return (
    <div className="group-expenses-container">
      <div className="expenses-card-header">
        <div className="expenses-card-heading">
          <div className="expenses-heading-icon" aria-hidden="true">£</div>
          <div>
            <h1 className="group-name">{props.group.name}</h1>
            <p className="expenses-subtitle">Track and split group expense easily</p>
          </div>
        </div>
        <div className={`balance-summary balance-summary-${balanceStatus}`}>
          <span className="balance-summary-label">
            {outstandingBalance > 0
              ? "You owe"
              : outstandingBalance < 0
                ? "You are owed"
                : "Settled"}
          </span>
          <div className="balance-summary-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M7 17 17 7M8 7h9v9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="balance">
            <span
              className={
                outstandingBalance > 0
                  ? "balance-value user-balance-red"
                  : outstandingBalance < 0
                    ? "balance-value user-balance-green"
                    : "balance-value balance-zero"
              }
            >
              {outstandingBalance < 0
                ? "£" +
                  String(
                    (outstandingBalance / 100).toFixed(2),
                  ).substring(1)
                : "£" +
                  (outstandingBalance / 100).toFixed(2)}
            </span>
          </h2>
        </div>
      </div>
      <div className="expense-container" ref={containerRef}>
        <AddExpense
          onClick={(expense) => {
            addExpense(expense);
          }}
          reset={clearForm}
          author={props.group.activeUser}
          onReset={(reset) => {
            setClearForm(reset);
          }}
          groupUsers={props.group.users}
          activeUser={props.group.activeUser}
          usersMinusActive={props.group.usersMinusActive}
        ></AddExpense>
        <div className="expense-history-header">
          <div className="expense-history-icon" aria-hidden="true">↗</div>
          <div>
            <h2>Expense History</h2>
            <p>All group expense will appear here</p>
          </div>
        </div>
        <TransitionGroup component={null}>
          {expenses.map((expense) => (
            <CSSTransition
              exit={false}
              timeout={50}
              classNames="summaries"
              key={expense.creationDatetime}
            >
              <Expense
                value={expense}
                activeUser={props.group.activeUser}
                key={expense.creationDatetime}
              ></Expense>
            </CSSTransition>
          ))}
        </TransitionGroup>
      </div>
    </div>
  );
}

export default GroupExpenses;
