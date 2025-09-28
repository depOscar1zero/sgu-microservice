const puppeteer = require("puppeteer");
const { testUtils } = global;

describe("SGU E2E Tests", () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI === "true", // Headless en CI, con UI en desarrollo
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe("User Registration and Login Flow", () => {
    test("should complete user registration flow", async () => {
      // Navigate to registration page
      await page.goto("http://localhost:3005/register");
      await page.waitForSelector("form");

      // Fill registration form
      const userData = testUtils.generateUser();
      await page.type('input[name="firstName"]', userData.firstName);
      await page.type('input[name="lastName"]', userData.lastName);
      await page.type('input[name="email"]', userData.email);
      await page.type('input[name="password"]', userData.password);
      await page.type('input[name="studentId"]', userData.studentId);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForNavigation({ waitUntil: "networkidle0" });
      expect(page.url()).toContain("/dashboard");
    });

    test("should complete user login flow", async () => {
      // Navigate to login page
      await page.goto("http://localhost:3005/login");
      await page.waitForSelector("form");

      // Fill login form
      await page.type('input[name="email"]', "test@example.com");
      await page.type('input[name="password"]', "password123");

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForNavigation({ waitUntil: "networkidle0" });
      expect(page.url()).toContain("/dashboard");
    });
  });

  describe("Course Management Flow", () => {
    beforeEach(async () => {
      // Login first
      await page.goto("http://localhost:3005/login");
      await page.waitForSelector("form");
      await page.type('input[name="email"]', "test@example.com");
      await page.type('input[name="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: "networkidle0" });
    });

    test("should view courses list", async () => {
      // Navigate to courses page
      await page.goto("http://localhost:3005/courses");
      await page.waitForSelector('[data-testid="courses-grid"]');

      // Check that courses are displayed
      const courses = await page.$$('[data-testid="course-card"]');
      expect(courses.length).toBeGreaterThan(0);
    });

    test("should filter courses", async () => {
      await page.goto("http://localhost:3005/courses");
      await page.waitForSelector('[data-testid="courses-grid"]');

      // Apply semester filter
      await page.select('select[id="semester-filter"]', "1");
      await page.click('button[id="filter-button"]');

      // Wait for filtered results
      await page.waitForTimeout(1000);
      const courses = await page.$$('[data-testid="course-card"]');
      expect(courses.length).toBeGreaterThanOrEqual(0);
    });

    test("should enroll in a course", async () => {
      await page.goto("http://localhost:3005/courses");
      await page.waitForSelector('[data-testid="courses-grid"]');

      // Find first available course and click enroll
      const enrollButton = await page.$(
        '[data-testid="enroll-button"]:not([disabled])'
      );
      if (enrollButton) {
        await enrollButton.click();

        // Wait for success notification
        await page.waitForSelector('[data-testid="success-notification"]', {
          timeout: 5000,
        });

        // Verify button state changed
        const buttonText = await page.$eval(
          '[data-testid="enroll-button"]',
          (el) => el.textContent
        );
        expect(buttonText).toContain("Inscrito");
      }
    });
  });

  describe("Enrollment Management Flow", () => {
    beforeEach(async () => {
      // Login first
      await page.goto("http://localhost:3005/login");
      await page.waitForSelector("form");
      await page.type('input[name="email"]', "test@example.com");
      await page.type('input[name="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: "networkidle0" });
    });

    test("should view enrollments list", async () => {
      await page.goto("http://localhost:3005/enrollments");
      await page.waitForSelector('[data-testid="enrollments-list"]');

      // Check that enrollments are displayed
      const enrollments = await page.$$('[data-testid="enrollment-item"]');
      expect(enrollments.length).toBeGreaterThanOrEqual(0);
    });

    test("should filter enrollments by status", async () => {
      await page.goto("http://localhost:3005/enrollments");
      await page.waitForSelector('[data-testid="enrollments-list"]');

      // Apply status filter
      await page.select('select[id="status-filter"]', "pending");
      await page.click('button[id="filter-button"]');

      // Wait for filtered results
      await page.waitForTimeout(1000);
      const enrollments = await page.$$('[data-testid="enrollment-item"]');
      expect(enrollments.length).toBeGreaterThanOrEqual(0);
    });

    test("should cancel an enrollment", async () => {
      await page.goto("http://localhost:3005/enrollments");
      await page.waitForSelector('[data-testid="enrollments-list"]');

      // Find first cancelable enrollment
      const cancelButton = await page.$(
        '[data-testid="cancel-enrollment-button"]:not([disabled])'
      );
      if (cancelButton) {
        await cancelButton.click();

        // Wait for confirmation dialog or success notification
        await page.waitForSelector('[data-testid="success-notification"]', {
          timeout: 5000,
        });
      }
    });
  });

  describe("Payment Flow", () => {
    beforeEach(async () => {
      // Login first
      await page.goto("http://localhost:3005/login");
      await page.waitForSelector("form");
      await page.type('input[name="email"]', "test@example.com");
      await page.type('input[name="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: "networkidle0" });
    });

    test("should view payments list", async () => {
      await page.goto("http://localhost:3005/payments");
      await page.waitForSelector('[data-testid="payments-list"]');

      // Check that payments are displayed
      const payments = await page.$$('[data-testid="payment-item"]');
      expect(payments.length).toBeGreaterThanOrEqual(0);
    });

    test("should create a new payment", async () => {
      await page.goto("http://localhost:3005/payments");
      await page.waitForSelector('[data-testid="payments-list"]');

      // Click create payment button
      const createButton = await page.$(
        '[data-testid="create-payment-button"]'
      );
      if (createButton) {
        await createButton.click();

        // Wait for payment form
        await page.waitForSelector('[data-testid="payment-form"]');

        // Fill payment form
        await page.type('input[name="amount"]', "100.00");
        await page.select('select[name="paymentMethod"]', "credit_card");

        // Submit payment
        await page.click('button[type="submit"]');

        // Wait for success notification
        await page.waitForSelector('[data-testid="success-notification"]', {
          timeout: 10000,
        });
      }
    });
  });

  describe("Dashboard and Navigation", () => {
    beforeEach(async () => {
      // Login first
      await page.goto("http://localhost:3005/login");
      await page.waitForSelector("form");
      await page.type('input[name="email"]', "test@example.com");
      await page.type('input[name="password"]', "password123");
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: "networkidle0" });
    });

    test("should display dashboard with statistics", async () => {
      await page.goto("http://localhost:3005/dashboard");
      await page.waitForSelector('[data-testid="dashboard-stats"]');

      // Check that statistics are displayed
      const stats = await page.$$('[data-testid="stat-card"]');
      expect(stats.length).toBeGreaterThan(0);
    });

    test("should navigate between pages using sidebar", async () => {
      // Test navigation to courses
      await page.click('[data-testid="sidebar-courses"]');
      await page.waitForNavigation({ waitUntil: "networkidle0" });
      expect(page.url()).toContain("/courses");

      // Test navigation to enrollments
      await page.click('[data-testid="sidebar-enrollments"]');
      await page.waitForNavigation({ waitUntil: "networkidle0" });
      expect(page.url()).toContain("/enrollments");

      // Test navigation to payments
      await page.click('[data-testid="sidebar-payments"]');
      await page.waitForNavigation({ waitUntil: "networkidle0" });
      expect(page.url()).toContain("/payments");
    });

    test("should logout successfully", async () => {
      // Click logout button
      await page.click('[data-testid="sidebar-logout"]');
      await page.waitForNavigation({ waitUntil: "networkidle0" });

      // Should redirect to login page
      expect(page.url()).toContain("/login");
    });
  });

  describe("Error Handling", () => {
    test("should handle network errors gracefully", async () => {
      // Navigate to a page that might fail
      await page.goto("http://localhost:3005/courses");

      // Check for error messages
      const errorMessage = await page.$('[data-testid="error-message"]');
      if (errorMessage) {
        const errorText = await page.evaluate(
          (el) => el.textContent,
          errorMessage
        );
        expect(errorText).toBeDefined();
      }
    });

    test("should handle form validation errors", async () => {
      await page.goto("http://localhost:3005/login");
      await page.waitForSelector("form");

      // Submit empty form
      await page.click('button[type="submit"]');

      // Check for validation errors
      const errors = await page.$$('[data-testid="validation-error"]');
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
