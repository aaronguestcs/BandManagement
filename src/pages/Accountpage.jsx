import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AccountPage({ userId, API, onLogout }) {
    const [user, setUser] = useState(null)
    const [band, setBand] = useState(null)
    const [editing, setEditing] = useState(false)
    const [nameDraft, setNameDraft] = useState("")

    useEffect(() => {
        if (!userId) return
        fetch(`${API}/users/${userId}`).then(r => r.json()).then(setUser).catch(() => {})
        fetch(`${API}/bands/?user_id=${userId}`)
            .then(r => r.json())
            .then(bands => { if (bands.length > 0) setBand(bands[0]) })
            .catch(() => {})
    }, [userId])

    async function handleSaveName() {
        const res = await fetch(`${API}/bands/${band.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: nameDraft }),
        })
        setBand(await res.json())
        setEditing(false)
    }

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Account</h1>
                <Button variant="outline" onClick={onLogout}>Log Out</Button>
            </div>

            <div className="space-y-6">
                {/* Band name — editable */}
                <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Band Name</p>
                    {editing ? (
                        <div className="flex gap-2">
                            <Input
                                value={nameDraft}
                                onChange={e => setNameDraft(e.target.value)}
                                className="max-w-xs"
                            />
                            <Button onClick={handleSaveName} disabled={!nameDraft.trim()}>
                                Save
                            </Button>
                            <Button variant="outline" onClick={() => setEditing(false)}>
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{band?.name || "—"}</span>
                            {band && (
                                <button
                                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => { setNameDraft(band.name); setEditing(true) }}
                                >
                                    Edit
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Read-only account fields */}
                <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Username</p>
                    <span className="text-lg">{user?.username || "—"}</span>
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <span className="text-lg">{user?.email || "—"}</span>
                </div>
            </div>
        </div>
    )
}
