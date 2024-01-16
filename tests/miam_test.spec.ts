import { test, expect } from '@playwright/test';

test('check for H1 element on the page', async ({ page }) => {
    await page.goto('https://dev.miam.starling-burgers.com/');
    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Choisissez votre restaurant :'); // Remplacez 1 par le nombre attendu d'éléments H1
});

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
    test.beforeEach(async ({ page }) => {
      // Navigate to the menu page before each test
      await page.goto('https://mon.starling-burgers.com//order/menu/hannong');
    });
  
    test('Add each type of menu to the basket with default options', async ({ page }) => {
      // Find all the menu items on the page
      const menus = page.locator('#nav-menus > div > .category-item');
  
      // Get the count of all the menus
      const menuCount = await menus.count();
  
      // Loop through all the menus and add them to the basket
      for (let i = 0; i < menuCount; i++) {

        await test.step(`Testing menu item ${i}`, async () => {
          const itemName = await menus.nth(i).locator('h4').textContent();
          console.log(itemName)
          // Click on the menu to select it
          await menus.nth(i).click();
              
          // Wait for the pop-up to appear
          const popup = page.locator('#burger_modal');
          await expect(popup).toBeVisible();
  
          const menuItemRequired = page.locator('#burger_modal > div > div:nth-child(2) > div > div >div:has(h4:text-is("Obligatoire"))');
          const countItemsRequired = await menuItemRequired.count();
          console.log('item requis', countItemsRequired)

          for (let j = 0; j < countItemsRequired; j++) {
            let lastItem = menuItemRequired.nth(j).locator('+ * > div:last-child')
            let itemText = await lastItem.textContent()

            if (itemText?.includes('Frites')) {
              await lastItem.click();
              console.log(itemText, ' cliqué pour ouvrir les options des Frites');

              // Localisez la div voisine qui contient les options pour "Frites"
              const fritesOptions = lastItem.locator('div:nth-child(2) > div > ol > div');
              const fritesOptionsCount = await fritesOptions.count();
              
              // Logique pour sélectionner une option spécifique, par exemple la dernière
              if (fritesOptionsCount > 0) {
                  const lastFritesOption = fritesOptions.nth(fritesOptionsCount - 1);
                  await lastFritesOption.click(); // Cliquez sur la dernière option de "Frites"
                  let fritesOptionText = await lastFritesOption.textContent();
                  console.log(fritesOptionText, ' Frite options choisis ');
              }
              
              } else {
                  await lastItem.click();
                  console.log(itemText, ' cliqué');
              }
          }
          const popupClose = page.locator('#burger_modal > button:first-child');
          const addToCart = page.locator('#burger_modal > div > div:last-child > button:has-text("Ajouter pour")')
          let addToCartBtnText = await addToCart.textContent()
          console.log(addToCartBtnText)
          await popupClose.click()
  
  
          await expect(popup).not.toBeVisible()
        
        })
      }
  
    })
    test('Check basket with default menu options', async ({ page }) => {
    })

})