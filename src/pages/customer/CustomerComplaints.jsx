import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Loader2, Send } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const CustomerComplaints = () => {
    const { restaurantId } = useOutletContext();
    const navigate = useNavigate();

    const [issueType, setIssueType] = useState("");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);

    const issueOptions = [
        "Food Quality",
        "Service Speed",
        "Staff Behavior",
        "Cleanliness",
        "Wrong Order",
        "Other"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!issueType) {
            toast.error("Please select an issue type");
            return;
        }

        if (!restaurantId) {
            toast.error("Missing restaurant information");
            return;
        }

        setLoading(true);
        try {
            // Map the UI issue type to the backend enum
            const typeMapping = {
                "Food Quality": "FOOD",
                "Service Speed": "SERVICE",
                "Staff Behavior": "SERVICE",
                "Cleanliness": "CLEANLINESS",
                "Wrong Order": "FOOD",
                "Other": "OTHER"
            };

            const severityMapping = {
                "Food Quality": "MEDIUM",
                "Service Speed": "LOW",
                "Staff Behavior": "HIGH",
                "Cleanliness": "MEDIUM",
                "Wrong Order": "MEDIUM",
                "Other": "LOW"
            };

            await api.post('/complaints', {
                restaurant: restaurantId,
                customerName: "Guest Customer",
                contact: "Guest", // Backend requires contact
                type: typeMapping[issueType] || "OTHER",
                severity: severityMapping[issueType] || "MEDIUM",
                message: details || `Issue: ${issueType}`
            });

            toast.success("Report submitted. A manager will check this shortly.");
            navigate(-1);
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || "Failed to submit report";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb-20 max-w-lg mx-auto px-4 pt-6">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="mb-8">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 text-red-500 border border-red-500/20">
                    <AlertTriangle size={32} />
                </div>
                <h1 className="text-3xl font-bold mb-2">Report an Issue</h1>
                <p className="text-gray-400">We take this seriously. Please let us know what went wrong.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">What went wrong?</label>
                    <div className="grid grid-cols-2 gap-3">
                        {issueOptions.map(option => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setIssueType(option)}
                                className={`p-3 rounded-xl border text-sm font-medium transition-all ${issueType === option
                                    ? 'bg-red-500 text-white border-red-500'
                                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">More Details</label>
                    <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Please describe the issue..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 min-h-[120px] resize-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <>Submit Report <Send size={18} /></>}
                </button>
            </form>
        </div>
    );
};

export default CustomerComplaints;
