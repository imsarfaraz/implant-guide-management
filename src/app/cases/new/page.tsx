import { NewGuideCaseForm } from "@/components/new-case-form";
import { getCatalogs, getDoctors, getPatients } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewGuideCasePage() {
  const [catalogs, doctors, patients] = await Promise.all([getCatalogs(), getDoctors(), getPatients()]);

  return (
    <div className="mx-auto max-w-3xl">
      <NewGuideCaseForm
        doctors={doctors}
        patients={patients}
        systems={catalogs.systems}
        sleeves={catalogs.sleeves}
        compat={catalogs.compat}
        types={catalogs.types}
        staffList={catalogs.staffList}
      />
    </div>
  );
}
