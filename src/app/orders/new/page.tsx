import { NewOrderForm } from "@/components/new-order-form";
import { getCatalogs, getDoctors, getPatients, fetchGuideCases } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const [catalogs, doctors, patients, guideCases] = await Promise.all([
    getCatalogs(),
    getDoctors(),
    getPatients(),
    fetchGuideCases(),
  ]);

  const caseOptions = guideCases
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 60)
    .map((c) => ({
      id: c.id,
      displayId: c.displayId,
      doctor: c.doctor,
      patient: c.patient,
      doctorId: c.doctorId,
      patientId: c.patientId,
    }));

  return (
    <div className="mx-auto max-w-3xl">
      <NewOrderForm
        doctors={doctors}
        patients={patients}
        systems={catalogs.systems}
        tiers={catalogs.tiers}
        caseOptions={caseOptions}
      />
    </div>
  );
}
