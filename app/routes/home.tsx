import type { Route } from "./+types/home";
import Navbar from "~/components/navbar";
import ResumeCard from "~/components/ResumeCard";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResumeMind" },
    {
      name: "description",
      content: "Smart feedback for your dream job!",
    },
  ];
}

export default function Home() {
  const { auth, isLoading, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const showEmptyState = !isLoading && !loadingResumes && resumes.length === 0;

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate("/auth?next=/");
    }
  }, [auth.isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isLoading || !auth.isAuthenticated) return;

    let isMounted = true;

    const loadResumes = async () => {
      setLoadingResumes(true);

      try {
        const items = (await kv.list("resume:*", true)) as KVItem[] | undefined;
        const parsedResumes =
          items?.map((item) => JSON.parse(item.value) as Resume) ?? [];

        console.log("Fetched resumes", parsedResumes);
        if (isMounted) setResumes(parsedResumes);
      } finally {
        if (isMounted) setLoadingResumes(false);
      }
    };

    loadResumes();

    return () => {
      isMounted = false;
    };
  }, [auth.isAuthenticated, isLoading, kv]);
    

  return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover">
        <Navbar />

        <section className="main-section">
          <div className="page-heading py-16">
            <h1>Track Your Applications & Resume Ratings</h1>
            {showEmptyState ? (
              <h2>No resumes found. Upload your first resume to get feedback.</h2>
            ) : (
              <h2>Review your submissions and check AI-powered feedback.</h2>
            )}
          </div>
          {loadingResumes && (
            <div className="flex flex-col items-center justify-center">
              <img
                src="/images/resume-scan-2.gif"
                className="w-50"
                alt="Loading resumes"
              />
            </div>
          )}


          {!loadingResumes && resumes.length > 0 && (
            <div className="resumes-section">
              {resumes.map((resume) => (
                  <ResumeCard key={resume.id} resume={resume} />

              ))}

            </div>
          )}

          {showEmptyState && (
            <div className="flex flex-col items-center justify-center mt-10 gap-4">
              <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
                Upload Resume
              </Link>

            </div>
          )}
        
        </section>
      </main>
  );
}
