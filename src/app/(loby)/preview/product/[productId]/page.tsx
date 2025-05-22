import { redirect } from "next/navigation";

interface ProductPreviewPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export default async function ProductPreviewPage({
  params,
}: ProductPreviewPageProps) {
  const productId = (await params).productId;

  redirect(`/product/${productId}`);
}
