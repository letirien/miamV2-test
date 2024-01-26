import { test, expect, Page } from '@playwright/test';

interface MenuItem {
  menuId: number;
  menuName?: string;
  menuPrice?: string;
  menuItems: string[];
}

const menuSelected: MenuItem[] = [];
test.setTimeout(120000);

test.describe('Menu selection tests for hannong', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://mon.starling-burgers.com/order/menu/hannong');
  });

  test('Add each type of menu to the basket with default options', async ({ page }) => {
    const menus = page.locator('#nav-menus > div > .category-item');
    const menuCount = await menus.count();

    for (let i = 0; i < menuCount; i++) {
      await test.step(`Testing menu item ${i}`, async () => {
        const currentMenu: MenuItem = await handleMenu(page, menus, i);
        menuSelected.push(currentMenu);
        console.log(menuSelected);

        // Après avoir ajouté le dernier menu, vérifiez le panier
        if (i === menuCount - 1) {
            await checkBasket(page);
        }
      });
    }
  });

async function checkBasket(page:Page){
        const basketBtn = page.locator('#menu-content + div[role="button"]');
        // Attendre explicitement que l'URL change
        console.log(await basketBtn.isDisabled(), "btn panier est désactivé")
        console.log(await basketBtn.textContent())
        // if(basketBtn)
        // click not working, && goto NOT working check TODO: check why
        // await page.goto('https://mon.starling-burgers.com/order/cart')
        // await page.waitForURL(/.*\/order\/cart\/.*/);
    
        // const h2 = page.locator('h2');
        // await expect(h2).toHaveText('Vos Menu');
    
        // Afficher l'URL actuelle pour le débogage
        // console.log("URL actuelle:", page.url());
    
    
        // // Vérifier si l'URL contient le chemin spécifié
        // const menuItems = page.locator('xpath=//h2[contains(text(), "Vos Menu")]/following-sibling::div//ol/li');
        // // const menuNames = await menuItems.allTextContents();
        // console.log(await menuItems.count())
        // await expect(menuItems).toHaveCount(menuSelected.length);
    
}
async function handleMenu(page: Page, menus: any, index: number): Promise<MenuItem> {
  const currentMenu: MenuItem = { menuId: index, menuItems: [], menuPrice: '', menuName: '' };

  const itemName = await menus.nth(index).locator('h4').textContent();
  console.log(itemName);
  await menus.nth(index).click();

  const popup = page.locator('#burger_modal');
  await expect(popup).toBeVisible();

  const requiredTitle = popup.locator('div > div:nth-child(2) > div > div > div > h3');
  const menuItemRequired = popup.locator('div > div:nth-child(2) > div > div >div:has(h4:text-is("Obligatoire"))');
  const countItemsRequired = await menuItemRequired.count();
  console.log('item requis', countItemsRequired);

  currentMenu.menuName = itemName ?? '';

  for (let j = 0; j < countItemsRequired; j++) {
    let items = menuItemRequired.nth(j).locator('+ * > div');
    let itemsCount = await items.count();

    let requiredTitleText = await requiredTitle.nth(j).textContent();
    let toGet = requiredTitleText?.includes('au moins') ? 3 : 1;
    let selectedIndex = toGet === 1 ? Math.floor(Math.random() * itemsCount) : 0;
    for (let n = 0; n < itemsCount && n < toGet; n++) {
      let itemIndex = toGet === 1 ? selectedIndex : n; 
      let item = items.nth(itemIndex);
      let currentItemText = await item.textContent();
      if (toGet === 1 && currentItemText?.includes('Frites')) {
        // Si "Frites" est sélectionné aléatoirement, appliquez une logique spécifique
        await handleFritesSelection(page, item, currentMenu);
      } else {
        // Si un autre élément est sélectionné ou si la logique "au moins" est appliquée
        await item.click();
        console.log(currentItemText, 'cliqué et ou sélectionné');
        if(currentItemText)
        currentMenu.menuItems.push(currentItemText.trim());
      }
      
    }
  }
  async function handleFritesSelection(page: Page, fritesItem: any, currentMenu: MenuItem) {
    await fritesItem.click();
    const fritesOptions = fritesItem.locator('div:nth-child(2) > div > ol > div');
    const fritesOptionsCount = await fritesOptions.count();
  
    if (fritesOptionsCount > 0) {
      const lastFritesOption = fritesOptions.nth(fritesOptionsCount - 1);
      await lastFritesOption.click();
      let fritesOptionText = await lastFritesOption.textContent();
      console.log('accompagnement', fritesOptionText, 'pour frites');
      currentMenu.menuItems.push('Frites ' + fritesOptionText.trim());
    }
  }
  await page.waitForTimeout(500);

  let addToCartBtnText = await page.locator('#burger_modal > div > div:last-child > button:has-text("Ajouter pour")').textContent();
  let prix = addToCartBtnText?.replace("Ajouter pour", "")
  if (prix) {
    currentMenu.menuPrice = prix
  }
  const addToCart = popup.locator('div > div:last-child > button:has-text("Ajouter pour")');
  if (addToCart) {
    console.log('le bouton est pas cliquable: ', await addToCart.isDisabled())
    await addToCart.click();
    console.log('Le bouton Ajouter au panier a été cliqué pour', itemName);
  }

  await expect(popup).not.toBeVisible();
  return currentMenu;
}
})