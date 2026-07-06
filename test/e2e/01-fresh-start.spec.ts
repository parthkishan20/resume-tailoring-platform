// test/e2e/01-fresh-start.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Scenario 1: Fresh start", () => {
  test.beforeEach(async ({ request }) => {
    // Reset state: delete master resume if exists
    await request.delete("/api/master-resume").catch(() => {});
    await request.delete("/api/chat").catch(() => {});
  });

  test("empty state renders with guided UI", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-testid=empty-state]")).toBeVisible();
  });

  test("sample YAML download link is present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Download Sample YAML")).toBeVisible();
  });

  test("PDF import drop zone is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-testid=pdf-import-zone]")).toBeVisible();
  });
});
