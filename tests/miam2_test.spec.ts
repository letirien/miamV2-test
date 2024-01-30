import { test, expect, Page } from '@playwright/test';

interface MenuItem {
  menuId: number;
  menuName?: string;
  menuPrice?: string;
  menuItems: string[];
}

const menuSelected: MenuItem[] = [];
test.setTimeout(120000);
test('click on restaurants div, and redirect check',async({page})=>{
  await page.goto('https://dev.miam.starling-burgers.com/');

 // Obtenir le nombre de restaurants
 const restaurantCount = await page.$$eval('div[role="button"]', divs => divs.length);

 for (let i = 0; i < restaurantCount; i++) {
     // Naviguer vers la page d'accueil à chaque itération
     await page.goto('https://dev.miam.starling-burgers.com/');

     // Attendre que les éléments soient chargés
     await page.waitForSelector('div[role="button"]');

     // Obtenir le restaurant actuel et cliquer dessus
     const restaurants = await page.$$('div[role="button"]');
     await restaurants[i].click();

     // Attendre explicitement que l'URL change
     await page.waitForURL(/.*\/order\/menu\/.*/);

     // Afficher l'URL actuelle pour le débogage
     console.log("URL actuelle:", page.url());

     // Vérifier si l'URL contient le chemin spécifié
     expect(page.url()).toContain('/order/menu/');
 }
})

test.describe('Menu selection tests for hannong', () => {
  // test.beforeEach(async ({ page }) => {
  //   // await page.goto('https://mon.starling-burgers.com/order/menu/hannong');
  // });

  test('Add each type of menu to the basket with default options', async ({ page }) => {
    await page.goto('https://mon.starling-burgers.com/order/menu/hannong');
    const menus = page.locator('#nav-menus > div > .category-item');
    const menuCount = await menus.count();

    for (let i = 0; i < menuCount; i++) {
      await test.step(`Testing menu item ${i}`, async () => {
        const currentMenu: MenuItem = await handleMenu(page, menus, i);
        menuSelected.push(currentMenu);

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
        await Promise.all([
          page.waitForURL(/\/order\/cart/, { waitUntil: 'domcontentloaded' }), // attendre que l'URL spécifique soit atteinte
          basketBtn.click() // déclencher la navigation
      ]);
        // Afficher l'URL actuelle pour le débogage
        console.log("URL actuelle:", page.url());
        console.log(menuSelected)
        
        // Vérifier si l'URL contient le chemin spécifié
        expect(page.url()).toMatch(/\/order\/cart/);

        const h2 = page.locator('h2');
        await expect(h2).toHaveText('Vos Menu');
  
    
        // // const menuNames = await menuItems.allTextContents();
        // console.log(await menuItems.count())
        // await expect(menuItems).toHaveCount(menuSelected.length);  
}
async function verifyBasket(page:Page, menuSelected:any) {
  // Convertir le prix total de la page en un format numérique
  const totalDisplayed = await page.textContent('SELECTEUR_PRIX_TOTAL'); // Remplacez SELECTEUR_PRIX_TOTAL par le sélecteur approprié
  let totalDisplayedNumber
  if(totalDisplayed)
    totalDisplayedNumber = parseFloat(totalDisplayed.replace('€', '').trim().replace(' ', '').replace(',', '.'));

  // Calculer le prix total attendu à partir du tableau menuSelected
  let totalExpected = 0;
  menuSelected.forEach(menu => {
      const priceNumber = parseFloat(menu.menuPrice.replace('€', '').trim().replace(' ', '').replace(',', '.'));
      totalExpected += priceNumber;
  });

  // Comparer les totaux
  console.log(`Prix total affiché : ${totalDisplayedNumber}, Prix total attendu : ${totalExpected}`);
  expect(totalDisplayedNumber).toBeCloseTo(totalExpected, 2); // Utilisez une tolérance si nécessaire

  // Vérifier chaque menu
  for (let i = 0; i < menuSelected.length; i++) {
      const menu = menuSelected[i];
      // Ici, vous devez localiser les éléments sur la page qui correspondent aux détails de chaque menu
      // et les comparer avec les informations de menuSelected
      // Par exemple:
      const menuNameDisplayed = await page.textContent(`SELECTEUR_NOM_MENU_${i}`); // Remplacez par le sélecteur approprié
      expect(menuNameDisplayed).toContain(menu.menuName);

      // Répétez pour les autres éléments comme les articles du menu, etc.
  }
}
async function handleMenu(page: Page, menus: any, index: number): Promise<MenuItem> {
  const currentMenu: MenuItem = { menuId: index, menuItems: [], menuPrice: '', menuName: '' };

  const itemName = await menus.nth(index).locator('h4').textContent();
  console.log(itemName);
  await menus.nth(index).click();

  const popup = page.locator('#burger_modal');
  await expect(popup).toBeVisible();
  await page.waitForTimeout(500);
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
    // cas particulier pour perso, coche tous
    let selectedIndex = toGet === 1 ? Math.floor(Math.random() * itemsCount) : 0;
    for (let n = 0; n < itemsCount && n < toGet; n++) {
      let itemIndex = toGet === 1 ? selectedIndex : n; 
      let item = items.nth(itemIndex);
      let currentItemText = await item.textContent();
      if (toGet === 1 && currentItemText?.includes('Frites')) {
        // Si "Frites" est sélectionné aléatoirement, appliquez une logique spécifique
        await handleFritesSelection(page, item, currentMenu);
        
      }
      else{
        // Si un autre élément est sélectionné ou si la logique "au moins" est appliquée
        await item.click();
        currentItemText  ? currentMenu.menuItems.push(currentItemText.trim()) : ''

      }
      
    }
  }
  async function handleFritesSelection(page: Page, fritesItem: any, currentMenu: MenuItem) {
    await fritesItem.click();
    let fritesOption = fritesItem.locator('#BIPA');
    // let fritesOptionsCount = await fritesOptions.count();
  
    if (fritesOption) {
      await fritesOption.click();
      
      let fritesOptionText = await fritesOption.textContent();
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