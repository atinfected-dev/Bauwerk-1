import { Card } from "@/components/ui/card";

interface Props {
  title: string;
  value: string;
}

export default function StatCard({ title, value }: Props) {
  return (
    <Card className="p-6">
      <p className="text-gray-500 text-sm">
        {title}
      </p>

      <h2 className="mt-3 text-4xl font-bold">
        {value}
      </h2>
    </Card>
  );
}