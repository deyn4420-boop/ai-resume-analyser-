import { useEffect, useState, type FormEvent } from "react";
import Navbar from "~/components/navbar";
import FileUploader from "~/components/FileUploader";
import { convertPdfToImage } from "~/lib/pdf2img";
import { prepareInstructions } from "~/constants";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";
import { useNavigate } from "react-router";

type UploadedResume = Omit<Resume, "feedback"> & {
    jobDescription: string;
    feedback: Feedback | string;
};

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate("/auth?next=/upload");
        }
    }, [auth.isAuthenticated, isLoading, navigate]);

    const handleFileSelect = (file: File | null) => {
        setFile(file);
    };

    const getErrorMessage = (err: unknown) => {
        if (err instanceof Error) return err.message;
        if (typeof err === "string") return err;

        if (err && typeof err === "object") {
            const maybeError = err as {
                message?: unknown;
                error?: unknown;
                details?: unknown;
            };

            if (typeof maybeError.message === "string") return maybeError.message;
            if (typeof maybeError.error === "string") return maybeError.error;
            if (typeof maybeError.details === "string") return maybeError.details;

            try {
                return JSON.stringify(err);
            } catch {
                return "Something went wrong";
            }
        }

        return "Something went wrong";
    };

    const stopWithError = (message: string) => {
        console.error("Resume upload failed:", message);
        setStatusText(`Error: ${message}`);
        setIsProcessing(false);
    };

    const parseFeedback = (feedbackText: string): Feedback => {
        const withoutCodeFence = feedbackText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        const firstBrace = withoutCodeFence.indexOf("{");
        const lastBrace = withoutCodeFence.lastIndexOf("}");

        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error("The AI response did not include valid JSON feedback.");
        }

        return JSON.parse(withoutCodeFence.slice(firstBrace, lastBrace + 1)) as Feedback;
    };

    const getFeedbackText = (feedback: AIResponse) => {
        const content = feedback.message.content;

        if (typeof content === "string") return content;

        const textContent = content.find(
            (item) => item && typeof item === "object" && "text" in item
        ) as { text?: unknown } | undefined;

        if (typeof textContent?.text === "string") return textContent.text;

        throw new Error("The AI response did not include text feedback.");
    };

    const handleAnalyze = async ({
        companyName,
        jobTitle,
        jobDescription,
        file,
    }: {
        companyName: string;
        jobTitle: string;
        jobDescription: string;
        file: File;
    }) => {
        setIsProcessing(true);
        setStatusText("Uploading the file...");
        let resumeKey = "";

        try {
            const uploadedFile = await fs.upload([file]);
            if (!uploadedFile) return stopWithError("Failed to upload file");

            setStatusText("Converting to image...");
            const imageFile = await convertPdfToImage(file);
            if (!imageFile.file) {
                return stopWithError(
                    imageFile.error || "Failed to convert PDF to image"
                );
            }

            setStatusText("Uploading the image...");
            const uploadedImage = await fs.upload([imageFile.file]);
            if (!uploadedImage) return stopWithError("Failed to upload image");

            setStatusText("Preparing data...");

            const uuid = generateUUID();
            resumeKey = `resume:${uuid}`;
            const data: UploadedResume = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName,
                jobTitle,
                jobDescription,
                feedback: "",
            };
            await kv.set(resumeKey, JSON.stringify(data));

            setStatusText("Analyzing...");

            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({ jobTitle, jobDescription })
            );

            if (!feedback) return stopWithError("Failed to analyze resume");

            const feedbackText = getFeedbackText(feedback);

            data.feedback = parseFeedback(feedbackText);
            await kv.set(resumeKey, JSON.stringify(data));
            setStatusText("Analysis complete, redirecting...");
            console.log(data);
            navigate(`/resume/${uuid}`);
        } catch (err) {
            console.error("Resume upload failed", err);
            if (resumeKey) await kv.delete(resumeKey);
            stopWithError(getErrorMessage(err));
        }
    };


    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const companyName = formData.get("company-name") as string;
        const jobTitle = formData.get("job-title") as string;
        const jobDescription = formData.get("job-description") as string;

       if(!file) {
           setStatusText("Please upload a PDF resume first.");
           return;
       }

       handleAnalyze({ companyName, jobTitle, jobDescription, file });
    };

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>

                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>

                            <img
                                src="/images/resume-scan.gif"
                                alt="Resume scanning"
                                className="w-full"
                            />
                        </>
                    ) : (
                        <h2>
                            Drop your resume for an ATS score and improvement tips
                        </h2>
                    )}

                    {!isProcessing && statusText && (
                        <p className="text-red-600 text-lg">{statusText}</p>
                    )}

                    {!isProcessing && (
                        <form
                            id="upload-form"
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4 mt-8"
                        >
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" id="company-name" name="company-name" placeholder="Company Name"/>
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" id="job-title" name="job-title" placeholder="Job Title"/>
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} id="job-description" name="job-description" placeholder="Job Description"/>
                            </div>
                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>

                            <button className= "primary-button" type= "submit">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
};

export default Upload;
