import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const API = "http://localhost:8000"

export default function BandCreationPage({ setBandCreated }) {
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    async function handleCreateBand() {
        if (!name.trim()) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${API}/bands/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), user_id: 1 }), // TODO: Add user ID dynamically
            })
            if (!res.ok) throw new Error()
            setBandCreated(true)
        } catch {
            setError("Something went wrong — check that the backend is running.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md px-6">
                <h1 className="text-3xl font-bold mb-2">Name your band</h1>
                <p className="text-gray-500 text-sm mb-6">
                    You can change this later from your band settings.
                </p>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Band name</label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCreateBand()}
                            placeholder="The Rolling Stones"
                            autoFocus
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex gap-2 pt-2">
                        <Button
                            className="flex-1"
                            onClick={handleCreateBand}
                            disabled={!name.trim() || loading}
                        >
                            {loading ? "Creating..." : "Create Band"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
