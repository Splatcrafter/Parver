import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Construction } from "lucide-react"

interface PlaceholderPageProps {
  title: string
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <Construction className="size-12 text-muted-foreground" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>

        <p className="mt-3 max-w-md text-muted-foreground">
          Diese Seite befindet sich noch in Entwicklung und ist bald verfügbar.
        </p>

        <div className="mt-8">
          <Button variant="outline" onClick={() => navigate("/")}>
            Zur Startseite
          </Button>
        </div>
      </div>
    </div>
  )
}
