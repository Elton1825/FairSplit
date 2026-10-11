import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../components/app";
import User from "../components/user";

function mockJsonResponse(body, options = {}) {
  return Promise.resolve({
    ok: options.ok ?? true,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  global.fetch = jest.fn((url, options) => {
    if (options?.method === "POST" && url === "/users") {
      const body = JSON.parse(options.body);
      return mockJsonResponse({
        username: body.username,
        firstName: body.firstName,
        lastName: body.lastName,
      });
    }

    if (url === "/users") {
      return mockJsonResponse([]);
    }

    if (url === "/debts" || url === "/expenses") {
      return mockJsonResponse([]);
    }

    throw new Error(`Unexpected fetch: ${url}`);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("renders FairSplit title", async () => {
  render(<App />);
  const titleElement = screen.getByRole("heading", { name: /Fair\s*Split/i });
  expect(titleElement).toBeInTheDocument();
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith("/users");
  });
});

test("renders first-user flow for an empty database", async () => {
  render(<App />);

  expect(
    await screen.findByRole("button", { name: /add user/i }),
  ).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "Group Members" }),
  ).toBeInTheDocument();
  expect(screen.queryByText(/You owe/i)).not.toBeInTheDocument();
});

test("uses an existing first name when the member username is missing", () => {
  const { container } = render(
    <User group={{ debts: {} }} user={{ firstName: "Bob" }} />,
  );

  expect(container.querySelector(".user-pic")).toHaveTextContent("B");
});

test("cancels adding a group member without sending a request", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(await screen.findByRole("button", { name: /add user/i }));
  await user.type(
    screen.getByPlaceholderText("Enter your member name"),
    "alice",
  );
  await user.click(screen.getByRole("button", { name: "Cancel" }));

  expect(
    screen.getByRole("heading", { name: "Group Members" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByPlaceholderText("Enter your member name"),
  ).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalledWith(
    "/users",
    expect.objectContaining({ method: "POST" }),
  );
});

test("makes the first added user active", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(await screen.findByRole("button", { name: /add user/i }));
  await user.type(
    screen.getByPlaceholderText("Enter your member name"),
    "alice",
  );
  await user.click(screen.getByRole("button", { name: "Add Member" }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          username: "alice",
          firstName: "Cosmo",
          lastName: "Kramer",
          indebted: false,
          balance: 0,
        }),
      }),
    );
  });
  await waitFor(() => {
    expect(screen.getAllByDisplayValue("alice").length).toBeGreaterThan(0);
  });
});

test("waits for an existing-group member API response before completing submission", async () => {
  const user = userEvent.setup();
  let resolveCreateUser;
  const existingUsers = [
    { username: "alice", firstName: "Alice", lastName: "Example" },
  ];
  global.fetch = jest.fn((url, options = {}) => {
    if (url === "/users" && options.method === "POST") {
      return new Promise((resolve) => {
        resolveCreateUser = resolve;
      });
    }
    if (url === "/users") {
      return mockJsonResponse(existingUsers);
    }
    if (url === "/debts" || url === "/expenses") {
      return mockJsonResponse([]);
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });

  render(<App />);
  await screen.findByText("Members & Balances");

  await user.click(screen.getByRole("button", { name: /add user/i }));
  await user.type(screen.getByPlaceholderText("Enter member name"), "Test User");
  await user.click(screen.getByRole("button", { name: /add user/i }));

  await waitFor(() => {
    expect(resolveCreateUser).toBeDefined();
    expect(fetch).toHaveBeenCalledWith(
      "/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          username: "Test User",
          firstName: "Cosmo",
          lastName: "Kramer",
          indebted: false,
          balance: 0,
        }),
      }),
    );
  });
  expect(screen.getByPlaceholderText("Enter member name")).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: "test user" })).not.toBeInTheDocument();

  resolveCreateUser({
    ok: true,
    json: () =>
      Promise.resolve({
        username: "test user",
        firstName: "Cosmo",
        lastName: "Kramer",
      }),
  });

  expect(
    (await screen.findAllByRole("option", { name: "test user" })).length,
  ).toBeGreaterThan(0);
});

test("renders dashboard data and preserves user switching and Smart Split", async () => {
  const user = userEvent.setup();
  const expenses = [
    {
      creationDatetime: "2026-10-03T10:00:00.000Z",
      title: "Dinner",
      lender: "alice",
      borrowers: [["bob", 1000]],
      amount: 1000,
    },
  ];
  const debts = [{ from: "bob", to: "alice", amount: 1000 }];
  const users = [
    { username: "alice", firstName: "Alice", lastName: "Example" },
    { username: "bob", firstName: "Bob", lastName: "Example" },
  ];
  global.fetch = jest.fn((url, options = {}) => {
    if (url === "/users" && options.method === "POST") {
      return mockJsonResponse(JSON.parse(options.body));
    }
    if (url === "/debts" || url === "/optimisedDebts") {
      return mockJsonResponse(debts);
    }
    if (url === "/expenses") {
      return mockJsonResponse(expenses);
    }
    if (url === "/users") {
      return mockJsonResponse(users);
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });

  render(<App />);

  expect(await screen.findByText("Dinner")).toBeInTheDocument();
  expect(screen.getAllByText("£10.00").length).toBeGreaterThan(0);
  expect(screen.getByText("Members & Balances")).toBeInTheDocument();

  const selects = screen.getAllByRole("combobox");
  await user.selectOptions(selects[0], "bob");
  expect(selects[0]).toHaveValue("bob");

  await user.click(document.querySelector(".split-toggle"));
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith("/optimisedDebts");
  });

  await user.click(screen.getByRole("button", { name: /add user/i }));
  await user.type(screen.getByPlaceholderText("Enter member name"), "carol");
  await user.click(screen.getByRole("button", { name: /add user/i }));
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          username: "carol",
          firstName: "Cosmo",
          lastName: "Kramer",
          indebted: false,
          balance: 0,
        }),
      }),
    );
  });
  expect((await screen.findAllByRole("option", { name: "carol" })).length).toBeGreaterThan(0);
});

test("submits an expense using the existing payload and API endpoint", async () => {
  const user = userEvent.setup();
  let submittedExpense;
  global.fetch = jest.fn((url, options = {}) => {
    if (url === "/users") {
      return mockJsonResponse([
        { username: "alice", firstName: "Alice", lastName: "Example" },
        { username: "bob", firstName: "Bob", lastName: "Example" },
      ]);
    }
    if (url === "/debts") {
      return mockJsonResponse([]);
    }
    if (url === "/expenses" && options.method === "POST") {
      submittedExpense = JSON.parse(options.body);
      return mockJsonResponse({
        ...submittedExpense,
        creationDatetime: "2026-10-03T10:00:00.000Z",
      });
    }
    if (url === "/expenses") {
      return mockJsonResponse([]);
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });

  render(<App />);
  await screen.findByText("Expense History");
  await user.click(screen.getByRole("button", { name: "Add Expense" }));
  await waitFor(() => {
    expect(document.querySelector(".overflow-container")).toHaveClass(
      "overflow-container-expand",
    );
  });
  for (const field of ["Title", "Amount", "Lender", "Borrower"]) {
    expect(screen.getByText(field, { selector: "header" })).toBeVisible();
  }
  await user.type(document.querySelector(".title-input"), "Dinner");
  await user.type(document.querySelector(".amount-input"), "10");
  const expenseSelects = document.querySelectorAll(
    ".add-expense-panel .user-dropdown",
  );
  await user.selectOptions(expenseSelects[0], "bob");
  expect(expenseSelects[0]).toHaveValue("bob");
  await user.selectOptions(expenseSelects[0], "alice");
  await user.selectOptions(expenseSelects[1], "bob");
  expect(expenseSelects[1]).toHaveValue("bob");
  expect(document.querySelector(".borrower-split")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Confirm Expense" }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "/expenses",
      expect.objectContaining({ method: "POST" }),
    );
  });
  expect(submittedExpense).toEqual({
    title: "Dinner",
    author: "alice",
    lender: "alice",
    borrowers: [["bob", 1000]],
    amount: 1000,
  });
});

test("settles a balance using the existing endpoint and payload", async () => {
  const user = userEvent.setup();
  let submittedSettlement;
  const debt = { from: "bob", to: "alice", amount: 1000 };
  global.fetch = jest.fn((url, options = {}) => {
    if (url === "/users") {
      return mockJsonResponse([
        { username: "alice", firstName: "Alice", lastName: "Example" },
        { username: "bob", firstName: "Bob", lastName: "Example" },
      ]);
    }
    if (url === "/expenses") {
      return mockJsonResponse([]);
    }
    if (url === "/debts") {
      return mockJsonResponse([debt]);
    }
    if (url === "/debts/settle" && options.method === "POST") {
      submittedSettlement = JSON.parse(options.body);
      return Promise.resolve({
        status: 200,
        headers: { get: () => "application/json" },
        json: () =>
          Promise.resolve({
            message: "Settlement complete",
            settlement: {
              title: "SETTLEMENT",
              creationDatetime: "2026-10-03T10:00:00.000Z",
              author: "alice",
              lender: "alice",
              borrowers: [["bob", 500]],
              amount: 500,
            },
          }),
      });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });

  render(<App />);
  await screen.findByText("Members & Balances");
  await user.selectOptions(
    document.querySelector(".settle-container select"),
    "bob",
  );
  await user.type(document.querySelector(".settle-container input"), "5");
  await user.click(screen.getByRole("button", { name: "Settle Up" }));

  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "/debts/settle",
      expect.objectContaining({ method: "POST" }),
    );
  });
  expect(submittedSettlement).toEqual({
    from: "bob",
    to: "alice",
    amount: 500,
  });
});
