import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import { createProductsWorkflow, createInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows";
import fs from "fs";
import path from "path";

// Note: To parse CSV easily, we'll recommend the user install 'csv-parser'
import csv from "csv-parser";

export default async function seedKaggleProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentService = container.resolve(Modules.FULFILLMENT);
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  
  logger.info("Starting Kaggle product import...");

  // Fetch necessary relationships for products (Sales Channel, Shipping Profile, Stock Location)
  let [defaultSalesChannel] = await salesChannelService.listSalesChannels({ name: "Default Sales Channel" });
  if (!defaultSalesChannel) {
    [defaultSalesChannel] = await salesChannelService.listSalesChannels();
  }

  const [shippingProfile] = await fulfillmentService.listShippingProfiles({ type: "default" });
  const [stockLocation] = await stockLocationService.listStockLocations();

  if (!defaultSalesChannel || !shippingProfile || !stockLocation) {
    logger.error("Missing core store configurations. Have you run the main seed.ts script yet?");
    return;
  }

  const results: any[] = [];
  
  // Using the 'fashion-product-images-small' dataset
  // Place the 'styles.csv' from 'myntradataset' folder into the root of 'agentic-store'
  const csvFilePath = path.resolve(process.cwd(), "styles.csv");

  if (!fs.existsSync(csvFilePath)) {
    logger.error(`CSV file not found at ${csvFilePath}. Please extract the downloaded zip and place 'styles.csv' (from the myntradataset folder) in the root of 'agentic-store'.`);
    return;
  }

  // Parse the CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve(results);
      })
      .on("error", reject);
  });

  logger.info(`Parsed ${results.length} products from CSV.`);

  // Limit to ~500 items if the dataset is huge
  const itemsToImport = results.slice(0, 500);

  // Add random offset to SKU to prevent collisions if run multiple times
  const runId = Date.now().toString().slice(-4);

  // Map the Kaggle 'styles.csv' columns to Medusa product input format
  const productsToCreate = itemsToImport.map((row, index) => {
    // Generate a mock price between $10 and $100 since the dataset doesn't have prices
    const mockPrice = Math.floor(Math.random() * 9000) + 1000;
    
    return {
      title: row.productDisplayName || `Fashion Item ${row.id}`,
      description: `${row.masterCategory} > ${row.subCategory} > ${row.articleType}. Suitable for ${row.gender}, season: ${row.season} ${row.year}. Usage: ${row.usage}.`,
      handle: `fashion-${row.id}-${Date.now()}`,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      sales_channels: [
        {
          id: defaultSalesChannel.id,
        }
      ],
      // Map the local image URL that Medusa will serve from its public folder
      images: [{ url: `http://localhost:9001/uploads/images/${row.id}.jpg` }],
      options: [
        {
          title: "Color",
          values: [row.baseColour || "Default"],
        },
      ],
      variants: [
        {
          title: `${row.baseColour || "Default"}`,
          sku: `SKU-${row.id}-${runId}`,
          options: {
            "Color": row.baseColour || "Default",
          },
          manage_inventory: true,
          allow_backorder: false,
          prices: [
            {
              amount: mockPrice, // Price in cents
              currency_code: "usd",
            },
            {
              amount: mockPrice, // Price in cents
              currency_code: "eur",
            },
          ],
        },
      ],
    };
  });

  // Batch create products in chunks to avoid overwhelming the database
  const chunkSize = 50;
  for (let i = 0; i < productsToCreate.length; i += chunkSize) {
    const chunk = productsToCreate.slice(i, i + chunkSize);
    logger.info(`Importing batch ${i / chunkSize + 1}...`);
    
    await createProductsWorkflow(container).run({
      input: {
        products: chunk,
      },
    });
  }

  logger.info("Products created. Fetching created variants to seed inventory...");
  
  // Seed inventory levels for the newly created products
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  });

  const inventoryLevels = inventoryItems
    .filter((v: any) => v.sku && v.sku.includes(runId))
    .map((v: any) => {
      // Random stock between 5 and 50
      const mockStock = Math.floor(Math.random() * 45) + 5;
      return {
        location_id: stockLocation.id,
        inventory_item_id: v.id,
        required_quantity: mockStock,
        stocked_quantity: mockStock,
      };
    });

  if (inventoryLevels.length > 0) {
    logger.info(`Seeding ${inventoryLevels.length} inventory levels...`);
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: inventoryLevels,
      },
    });
  }

  logger.info("Successfully imported Kaggle products and populated inventory!");
}
