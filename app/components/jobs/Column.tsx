import { JobApplication, ApplicationStatus } from "@/app/lib/types";
import { JobCard } from "./JobCard";
import { useDrop } from "react-dnd";

interface ColumnProps {
  title: string;
  status: ApplicationStatus;
  jobs: JobApplication[];
  onJobClick: (job: JobApplication) => void;
  onDropJob: (job: JobApplication, status: ApplicationStatus) => void;
}

export function Column({
  title,
  status,
  jobs,
  onJobClick,
  onDropJob,
}: ColumnProps) {
  // Create a drop handler that logs the drop event and then calls onDropJob
  const dropHandler = (item: JobApplication) => {
    console.log("Dropped item:", item, "onto column:", status);
    onDropJob(item, status);
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: "JOB_CARD",
    drop: dropHandler,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`flex h-full w-full flex-col rounded-lg bg-gray-50 p-4 ${
        isOver ? "bg-gray-100" : ""
      }`}
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="flex flex-col gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onClick={onJobClick} />
        ))}
      </div>
    </div>
  );
}

