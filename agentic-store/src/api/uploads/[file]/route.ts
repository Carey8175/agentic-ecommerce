import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import path from "path";
import fs from "fs";

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const fileName = req.params.file as string;
  if (!fileName) {
    return res.status(404).send("Not found");
  }

  const filePath = path.join(process.cwd(), "uploads", fileName);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  return res.status(404).send("Not found");
};