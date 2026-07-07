import { useEffect, useState } from "react";
import { Link } from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import { usePuterStore } from "~/lib/puter";

const ResumeCard = ({ resume }: {
    resume: Resume;
}) => {
    const { fs } = usePuterStore();
    const { id, companyName, jobTitle, feedback, imagePath } = resume;
    const [resumeUrl, setResumeUrl] = useState("");

    useEffect(() => {
        let objectUrl = "";
        let isMounted = true;

        const loadResume = async () => {
            const blob = await fs.read(imagePath);
            if (!blob || !isMounted) return;

            objectUrl = URL.createObjectURL(blob);
            setResumeUrl(objectUrl);
        };

        loadResume();

        return () => {
            isMounted = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [fs, imagePath]);

    return (
        <Link
            to={`/resume/${id}`}
            className="resume-card animate-in fade-in duration-1000"
        >
            <div className="resume-card-header">
                <div className="flex flex-col gap-2">
                    <h2 className="text-black font-bold wrap-break-words">
                        {companyName || (!jobTitle ? "Resume" : "")}
                    </h2>

                    <h3 className="text-lg wrap-break-words text-gray-500">
                        {jobTitle}
                    </h3>
                </div>

                <div className="shrink-0">
                    <ScoreCircle score={feedback.overallScore} />
                </div>
            </div>

            {resumeUrl && (<div className="gradient-border animate-in duration-1000">
                <div className="w-full h-full">
                    <img
                        src={resumeUrl}
                        alt="resume"
                        className="w-full h-8.75 max-sm:h-50 object-cover object-top"
                    />
                </div>
            </div>
            )}
        </Link>
    );
};

export default ResumeCard;
