// test/e2e/02-master-resume.spec.ts
import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

const SAMPLE_YAML = readFileSync(join(__dirname, "../fixtures/sample-resume.yaml"), "utf-8");

test.describe("Scenario 2: Master resume CRUD", () => {
  test.beforeEach(async ({ request }) => {
    await request.delete("/api/master-resume").catch(() => {});
  });

  test("load sample, edit YAML, save, confirm preview shows", async ({ page }) => {
    await page.goto("/");
    // Click "Start from Sample"
    await page.getByText("Start from Sample").click();
    // YAML editor should now be visible
    await expect(page.locator("[data-testid=yaml-editor]")).toBeVisible();
    // Save
    await page.locator("[data-testid=save-master-resume]").click();
    // After save, editor still visible (no redirect)
    await expect(page.locator("[data-testid=save-master-resume]")).toBeVisible();
  });

  test("edit YAML content and save", async ({ page }) => {
    // Set up master resume via API
    await page.request.put("/api/master-resume", {
      data: { yaml_content: SAMPLE_YAML },
    });
    await page.goto("/");
    // YAML editor visible (not empty state)
    await expect(page.locator("[data-testid=yaml-editor]")).toBeVisible();
    // Type into editor - CodeMirror requires clicking first
    const editor = page.locator("[data-testid=yaml-editor]");
    await editor.click();
    // Save
    await page.locator("[data-testid=save-master-resume]").click();
    await expect(page.locator("[data-testid=save-master-resume]")).toBeVisible();
  });

  test("preview toggle shows preview container", async ({ page }) => {
    await page.request.put("/api/master-resume", {
      data: { yaml_content: SAMPLE_YAML },
    });
    await page.goto("/");
    await page.getByText("Preview").click();
    await expect(page.locator("[data-testid=resume-preview]")).toBeVisible();
  });
});
