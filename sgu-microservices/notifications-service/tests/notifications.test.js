const request = require("supertest");
const app = require("../src/app");
const { testUtils } = global;

describe("Notifications Service API", () => {
  let testNotification;
  let authToken;

  beforeAll(async () => {
    // Limpiar y sincronizar base de datos
    const database = require("../src/config/database");
    await database.connect();
  });

  afterAll(async () => {
    // Limpiar base de datos
    const database = require("../src/config/database");
    await database.disconnect();
  });

  beforeEach(async () => {
    // Mock de autenticación
    authToken = "mock-jwt-token";
  });

  describe("POST /api/notifications", () => {
    test("should create a new notification", async () => {
      const notificationData = {
        userId: "user-123",
        type: "email",
        subject: "Test Notification",
        message: "This is a test notification",
        recipient: {
          email: "test@example.com",
          name: "Test User",
        },
        priority: "normal",
      };

      const response = await request(app)
        .post("/api/notifications")
        .set("Authorization", `Bearer ${authToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(notificationData.userId);
      expect(response.body.data.type).toBe(notificationData.type);
      expect(response.body.data.subject).toBe(notificationData.subject);

      testNotification = response.body.data;
    });

    test("should return 400 for invalid data", async () => {
      const response = await request(app)
        .post("/api/notifications")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test("should return 401 without token", async () => {
      const response = await request(app)
        .post("/api/notifications")
        .send({
          userId: "user-123",
          type: "email",
          subject: "Test",
          message: "Test message",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/notifications/user/:userId", () => {
    test("should return user notifications", async () => {
      const response = await request(app)
        .get("/api/notifications/user/user-123")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test("should filter notifications by status", async () => {
      const response = await request(app)
        .get("/api/notifications/user/user-123?status=pending")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test("should filter notifications by type", async () => {
      const response = await request(app)
        .get("/api/notifications/user/user-123?type=email")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/notifications/:id", () => {
    test("should return specific notification", async () => {
      const response = await request(app)
        .get(`/api/notifications/${testNotification._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testNotification._id);
    });

    test("should return 404 for non-existent notification", async () => {
      const response = await request(app)
        .get("/api/notifications/non-existent-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/notifications/:id/read", () => {
    test("should mark notification as read", async () => {
      const response = await request(app)
        .patch(`/api/notifications/${testNotification._id}/read`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.readAt).toBeDefined();
    });
  });

  describe("PATCH /api/notifications/:id/cancel", () => {
    test("should cancel notification", async () => {
      const response = await request(app)
        .patch(`/api/notifications/${testNotification._id}/cancel`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("cancelled");
    });
  });

  describe("POST /api/notifications/send-immediate", () => {
    test("should send immediate notification", async () => {
      const notificationData = {
        userId: "user-123",
        type: "email",
        subject: "Immediate Test",
        message: "This is an immediate test notification",
        recipient: {
          email: "test@example.com",
        },
      };

      const response = await request(app)
        .post("/api/notifications/send-immediate")
        .set("Authorization", `Bearer ${authToken}`)
        .send(notificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/notifications/stats", () => {
    test("should return notification statistics", async () => {
      const response = await request(app)
        .get("/api/notifications/stats")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("total");
      expect(response.body.data).toHaveProperty("pending");
      expect(response.body.data).toHaveProperty("sent");
    });
  });

  describe("Health Check", () => {
    test("GET /health should return service status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe("Notifications Service");
      expect(response.body.status).toBe("healthy");
    });
  });
});

describe("Notification Model", () => {
  beforeAll(async () => {
    const database = require("../src/config/database");
    await database.connect();
  });

  afterAll(async () => {
    const database = require("../src/config/database");
    await database.disconnect();
  });

  test("should create notification with valid data", async () => {
    const Notification = require("../src/models/Notification");
    const notificationData = {
      userId: "user-123",
      type: "email",
      subject: "Test Subject",
      message: "Test message",
      recipient: {
        email: "test@example.com",
      },
    };

    const notification = new Notification(notificationData);
    await notification.save();

    expect(notification._id).toBeDefined();
    expect(notification.userId).toBe(notificationData.userId);
    expect(notification.type).toBe(notificationData.type);
    expect(notification.status).toBe("pending");
  });

  test("should validate required fields", async () => {
    const Notification = require("../src/models/Notification");

    await expect(new Notification({}).save()).rejects.toThrow();
  });

  test("should validate notification type", async () => {
    const Notification = require("../src/models/Notification");
    const notificationData = {
      userId: "user-123",
      type: "invalid-type",
      subject: "Test",
      message: "Test message",
    };

    await expect(new Notification(notificationData).save()).rejects.toThrow();
  });
});
