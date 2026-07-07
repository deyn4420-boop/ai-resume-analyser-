type ATSSuggestion = Feedback["ATS"]["tips"][number];

const ATS = ({
  score,
  suggestions,
}: {
  score: number;
  suggestions: ATSSuggestion[];
}) => {
  return (
    <div className="flex flex-col gap-4 bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-2xl font-bold text-black">ATS Score</h3>
        <span className="score-badge bg-badge-green text-badge-green-text font-semibold">
          {score}/100
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={`${suggestion.tip}-${index}`}
            className="flex flex-row gap-3 rounded-2xl bg-gray-50 p-4"
          >
            <span
              className={
                suggestion.type === "good"
                  ? "text-badge-green-text"
                  : "text-badge-yellow-text"
              }
            >
              {suggestion.type === "good" ? "Good" : "Improve"}
            </span>
            <p className="text-gray-700">{suggestion.tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ATS;
