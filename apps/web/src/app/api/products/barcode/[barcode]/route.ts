import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRequestUser } from "@/lib/http/route-guards";
import { lookupBarcodeProduct } from "@/lib/barcode/catalog";

const barcodeSchema = z.string().regex(/^\d{8,14}$/);

export async function GET(
  _request: Request,
  context: { params: Promise<{ barcode: string }> },
) {
  const userResult = await requireRequestUser();
  if (!userResult.ok) {
    return userResult.response;
  }

  const { barcode } = await context.params;
  const parsed = barcodeSchema.safeParse(barcode);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid barcode" }, { status: 400 });
  }

  const result = await lookupBarcodeProduct(parsed.data);

  if (!result) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product: result });
}
