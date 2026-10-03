import { test, expect } from '@playwright/test';

import { FRAMEWORK } from './constants';

test.describe('Node drag window blur', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/generic/nodes/drag-blur');
  });

  test('preserves the last position, stops once, and allows a fresh drag', async ({ page }) => {
    const node = page.locator(`.${FRAMEWORK}-flow__node[data-id="drag-blur"]`);
    const body = page.locator('body');
    await expect(node).toHaveCSS('visibility', 'visible');
    const box = (await node.boundingBox())!;
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    const initialTransform = await node.evaluate((element) => element.style.transform);

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 80, startY + 60, { steps: 8 });
    await expect(body).toHaveAttribute('data-drag-starts', '1');
    await expect(node).toHaveClass(/dragging/);
    const lastTransform = await node.evaluate((element) => element.style.transform);
    expect(lastTransform).not.toBe(initialTransform);
    const lastPosition = await node.evaluate((element) => {
      const transform = new DOMMatrixReadOnly(element.style.transform);
      return { x: transform.m41, y: transform.m42 };
    });

    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect(body).toHaveAttribute('data-drag-stops', '1');
    await expect(node).not.toHaveClass(/dragging/);
    const stoppedNode = await body.getAttribute('data-stopped-node');
    expect(JSON.parse(stoppedNode!)).toEqual({ position: lastPosition, dragging: false });

    await page.mouse.move(startX + 180, startY + 160);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('blur'));
    });
    await page.mouse.up();
    await expect(body).toHaveAttribute('data-drag-stops', '1');
    expect(await node.evaluate((element) => element.style.transform)).toBe(lastTransform);

    // A new gesture must work after the interrupted gesture has been finalized.
    await node.hover();
    await page.mouse.down();
    const nextBox = (await node.boundingBox())!;
    await page.mouse.move(nextBox.x + nextBox.width / 2 + 40, nextBox.y + nextBox.height / 2 + 30, { steps: 8 });
    await expect(body).toHaveAttribute('data-drag-starts', '2');
    await page.mouse.up();
    await expect(body).toHaveAttribute('data-drag-stops', '2');
    await expect(node).not.toHaveClass(/dragging/);
    expect(await node.evaluate((element) => element.style.transform)).not.toBe(lastTransform);
  });

  test('does not report a drag below the movement threshold', async ({ page }) => {
    const node = page.locator(`.${FRAMEWORK}-flow__node[data-id="drag-blur"]`);
    const body = page.locator('body');
    await expect(node).toHaveCSS('visibility', 'visible');
    const box = (await node.boundingBox())!;
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    const initialTransform = await node.evaluate((element) => element.style.transform);

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 1, startY + 1);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.mouse.move(startX + 80, startY + 60);
    await page.mouse.up();

    await expect(body).not.toHaveAttribute('data-drag-starts');
    await expect(body).not.toHaveAttribute('data-drag-stops');
    expect(await node.evaluate((element) => element.style.transform)).toBe(initialTransform);

    await node.hover();
    await page.mouse.down();
    await page.mouse.move(startX + 40, startY + 30, { steps: 8 });
    await page.mouse.up();
    await expect(body).toHaveAttribute('data-drag-starts', '1');
    await expect(body).toHaveAttribute('data-drag-stops', '1');
  });

  test('removes the blur listener after an ordinary mouseup', async ({ page }) => {
    const node = page.locator(`.${FRAMEWORK}-flow__node[data-id="drag-blur"]`);
    await expect(node).toHaveCSS('visibility', 'visible');
    const box = (await node.boundingBox())!;
    await node.hover();
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 60, { steps: 8 });
    await page.mouse.up();
    await expect(page.locator('body')).toHaveAttribute('data-drag-stops', '1');

    const extraMouseups = await page.evaluate(() => {
      let count = 0;
      const onMouseup = () => count++;
      window.addEventListener('mouseup', onMouseup);
      window.dispatchEvent(new Event('blur'));
      window.removeEventListener('mouseup', onMouseup);
      return count;
    });
    expect(extraMouseups).toBe(0);
    await expect(page.locator('body')).toHaveAttribute('data-drag-stops', '1');
  });
});
