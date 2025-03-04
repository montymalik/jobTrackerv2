import { JobApplication, ApplicationStatus } from "@/app/lib/types";
import { JobCard } from "./JobCard";
import { useDrop } from "react-dnd";
import { useRef } from "react";

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
  const dropRef = useRef<HTMLDivElement | null>(null);

  const [{ isOver }, drop] = useDrop({
    accept: "JOB_CARD",
    drop: (item: JobApplication) => {
      console.log("Dropped item:", item, "onto column:", status);
      onDropJob(item, status);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(dropRef);

  return (
    <div
      ref={dropRef}
      className={`
        flex h-full w-full flex-col
        rounded-lg 
        bg-gray-50 dark:bg-gray-900
        p-4 
        transition-colors
        ${isOver ? "bg-gray-100 dark:bg-gray-800" : ""}
      `}
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      <div className="flex flex-col gap-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onClick={onJobClick}
            columnStatus={status} // Pass column status to JobCard
          />
        ))}
      </div>
    </div>
  );
}

