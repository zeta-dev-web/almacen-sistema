export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Panel de control del sistema POS
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold">Ventas del día</h3>
          <p className="text-3xl font-bold mt-2">$0.00</p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold">Productos en stock</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold">Caja actual</h3>
          <p className="text-3xl font-bold mt-2">$0.00</p>
        </div>
      </div>
    </div>
  );
}
