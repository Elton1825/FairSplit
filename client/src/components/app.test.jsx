import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./app";

jest.mock("./group_expenses", () => () => null);
jest.mock("./group_users", () => {
  const React = jest.requireActual("react");
  return ({ group }) =>
    React.createElement(
      "div",
      null,
      group.users.map((user) =>
        React.createElement("span", { key: user.username }, user.username),
      ),
    );
});
jest.mock("./user_switching", () => () => null);

function jsonResponse(data, ok = true) {
  return {
    ok,
    status: ok ? 200 : 400,
    headers: {
      get: () => "application/json",
    },
    json: async () => data,
  };
}

function mockInitialData() {
  global.fetch = jest.fn((url, options = {}) => {
    if (options.method === "POST" && url.endsWith("/users")) {
      return new Promise((resolve) => {
        global.resolveCreateUser = resolve;
      });
    }

    if (url.endsWith("/debts")) {
      return Promise.resolve(jsonResponse([]));
    }
    if (url.endsWith("/expenses")) {
      return Promise.resolve(jsonResponse([]));
    }
    if (url.endsWith("/users")) {
      return Promise.resolve(jsonResponse([]));
    }

    throw new Error(`Unexpected request: ${url}`);
  });
}

describe("empty group member flow", () => {
  beforeEach(() => {
    delete global.resolveCreateUser;
    mockInitialData();
  });

  test("opens the dashboard only after the member API request succeeds", async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Add user" }));
    expect(
      screen.getByRole("heading", { name: "Add Group Member" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Member Name"), {
      target: { value: "New Member" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add Member/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/users$/),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "New Member",
            firstName: "Cosmo",
            lastName: "Kramer",
            indebted: false,
            balance: 0,
          }),
        }),
      );
    });
    expect(screen.getByRole("heading", { name: "Add Group Member" })).toBeInTheDocument();
    expect(document.querySelector(".dashboard-app")).not.toBeInTheDocument();

    global.resolveCreateUser(
      jsonResponse({
        username: "New Member",
        firstName: "Cosmo",
        lastName: "Kramer",
        indebted: false,
        balance: 0,
      }),
    );

    await waitFor(() => {
      expect(document.querySelector(".dashboard-app")).toBeInTheDocument();
    });
    expect(screen.getByText("New Member")).toBeInTheDocument();
  });

  test("keeps the add form open when the member API request fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Add user" }));
    fireEvent.change(screen.getByLabelText("Member Name"), {
      target: { value: "New Member" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add Member/ }));

    await waitFor(() => {
      expect(global.resolveCreateUser).toBeDefined();
    });
    global.resolveCreateUser(jsonResponse({ error: "Request failed" }, false));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Add Group Member" })).toBeInTheDocument();
    });
    expect(document.querySelector(".dashboard-app")).not.toBeInTheDocument();
    consoleError.mockRestore();
  });

  test("cancel returns from the add form to the group members screen", async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Add user" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("heading", { name: "Group Members" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Add Group Member" }),
    ).not.toBeInTheDocument();
  });
});
