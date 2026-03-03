import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Ban, Lock, ServerCrash, SearchX } from "lucide-react"

interface ErrorPageProps {
  statusCode?: number
  message?: string
}

const errorConfig: Record<number, { title: string; description: string; icon: React.ElementType }> = {
  400: {
    title: "Ungültige Anfrage",
    description: "Die Anfrage konnte nicht verarbeitet werden. Bitte überprüfen Sie Ihre Eingabe.",
    icon: AlertTriangle,
  },
  403: {
    title: "Zugriff verweigert",
    description: "Sie haben keine Berechtigung, auf diese Seite zuzugreifen.",
    icon: Lock,
  },
  404: {
    title: "Seite nicht gefunden",
    description: "Die angeforderte Seite existiert nicht oder wurde verschoben.",
    icon: SearchX,
  },
  500: {
    title: "Serverfehler",
    description: "Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
    icon: ServerCrash,
  },
  503: {
    title: "Dienst nicht verfügbar",
    description: "Der Server ist vorübergehend nicht erreichbar. Bitte versuchen Sie es in Kürze erneut.",
    icon: Ban,
  },
}

const defaultError = {
  title: "Unbekannter Fehler",
  description: "Ein unerwarteter Fehler ist aufgetreten.",
  icon: AlertTriangle,
}

export default function ErrorPage({ statusCode = 404, message }: ErrorPageProps) {
  const navigate = useNavigate()
  const config = errorConfig[statusCode] ?? defaultError
  const Icon = config.icon

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <Icon className="size-12 text-muted-foreground" strokeWidth={1.5} />
          </div>
        </div>

        <p className="text-8xl font-black tracking-tighter text-foreground/10">
          {statusCode}
        </p>

        <h1 className="-mt-4 text-2xl font-bold tracking-tight">
          {config.title}
        </h1>

        <p className="mt-3 max-w-md text-muted-foreground">
          {message ?? config.description}
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Zurück
          </Button>
          <Button onClick={() => navigate("/")}>
            Zur Startseite
          </Button>
        </div>
      </div>
    </div>
  )
}
