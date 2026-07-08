import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Handles both signing up and logging in — one page, toggled by `mode`.
// On success it hands the { access_token, user } payload up to App via onAuth.
export default function AccountCreationPage({ API, onAuth }) {
    const [mode, setMode] = useState("register")
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const isLogin = mode === "login"

    async function submit() {
        if (!email.trim() || !password || (!isLogin && !username.trim())) return
        setLoading(true)
        setError(null)
        try {
            const body = isLogin
                ? { email: email.trim(), password }
                : { username: username.trim(), email: email.trim(), password }
            const res = await fetch(`${API}/auth/${isLogin ? "login" : "register"}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.detail || "Something went wrong")
            }
            onAuth(await res.json())
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md px-6">
                <h1 className="text-3xl font-bold mb-2">
                    {isLogin ? "Welcome back" : "Create an account"}
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                    {isLogin
                        ? "Log in to manage your band."
                        : "Sign up to start managing your band."}
                </p>

                <div className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Username</label>
                            <Input
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="drummer_dave"
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && submit()}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex gap-2 pt-2">
                        <Button className="flex-1" onClick={submit} disabled={loading}>
                            {loading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
                        </Button>
                    </div>

                    <p className="text-sm text-gray-500 text-center">
                        {isLogin ? "Need an account?" : "Already have an account?"}{" "}
                        <button
                            className="text-gray-900 font-medium hover:underline"
                            onClick={() => { setMode(isLogin ? "register" : "login"); setError(null) }}
                        >
                            {isLogin ? "Sign up" : "Log in"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
