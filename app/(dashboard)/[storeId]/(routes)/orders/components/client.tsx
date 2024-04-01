"use client";

import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

import { columns, OrderColumn } from "./columns";
import { Button } from "@/components/ui/button";

interface OrderClientProps {
  data: OrderColumn[];
}

export const OrderClient: React.FC<OrderClientProps> = ({
  data
}) => {
  const redirectToStripe = () => {
    window.open('https://dashboard.stripe.com/payments');
  };
  return (
    <>
      <Heading title={`Orders (${data.length})`} description="View orders for your store" />
      <Separator />
      <Button onClick={redirectToStripe}>View Stripe Order Information</Button>
      <DataTable searchKey={"products"} columns={columns} data={data} />
    </>
  );
};