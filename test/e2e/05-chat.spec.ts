// test/e2e/05-chat.spec.ts
import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

const SAMPLE_YAML = readFileSync(join(__dirname, "../fixtures/sample-resume.yaml"), "utf-8");

test.describe("Scenario 5: Chat assistant", () => {
  test.beforeEach(async ({ request }) => {
    await request.put("/api/master-resume", { data: { yaml_content: SAMPLE_YAML } });
    await request.delete("/api/chat").catch(() => {});
  });

  test("send message, receive mocked response", async ({ page }) => {
    await page.goto("/");
    // Chat panel should be visible
    await expect(page.locator("[data-testid=chat-input]")).toBeVisible();
    // Type and send
    await page.locator("[data-testid=chat-input]").fill("Hello, what can you do?");
    await page.locator("[data-testid=chat-send]").click();
    // Wait for response message to appear
    await expect(page.locator("[data-testid=chat-message]")).toHaveCount(2, { timeout: 15_000 });
    // The assistant response should contain the mock text
    const assistantMsg = page.locator("[data-testid=chat-message]").last();
    await expect(assistantMsg).toContainText("master resume", { timeout: 15_000 });
  });
});
