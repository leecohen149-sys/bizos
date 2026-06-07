"use client"

import { Bell, BellOff, Share, Plus, Smartphone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePush } from "@/features/notifications/push-hooks"

export function PushSetup() {
  const push = usePush()

  if (!push.configured) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-4 text-sm">
          התראות Push אינן מוגדרות בשרת (חסר מפתח VAPID). התראות בתוך האפליקציה
          פעילות כרגיל.
        </CardContent>
      </Card>
    )
  }

  // iOS requires installing to the home screen before push works (16.4+).
  if (push.isIOS && !push.isStandalone) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="space-y-2 py-4 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Smartphone className="size-4" />
            הפעלת התראות ב‑iPhone / iPad
          </div>
          <ol className="text-muted-foreground list-inside list-decimal space-y-1">
            <li className="flex items-center gap-1">
              הקישו על <Share className="inline size-4" /> (שיתוף) בסרגל ספארי
            </li>
            <li className="flex items-center gap-1">
              בחרו <Plus className="inline size-4" /> «הוסף למסך הבית»
            </li>
            <li>פתחו את האפליקציה מהמסך הבית והפעילו התראות</li>
          </ol>
        </CardContent>
      </Card>
    )
  }

  if (!push.supported) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-4 text-sm">
          הדפדפן הזה אינו תומך בהתראות Push.
        </CardContent>
      </Card>
    )
  }

  if (push.permission === "denied") {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-4 text-sm">
          חסמתם התראות לאתר זה. ניתן לאפשר מחדש בהגדרות הדפדפן.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-2 text-sm">
          {push.subscribed ? (
            <Bell className="text-status-done size-4" />
          ) : (
            <BellOff className="text-muted-foreground size-4" />
          )}
          <span>
            {push.subscribed
              ? "התראות Push פעילות במכשיר הזה"
              : "קבלו התראות גם כשהאפליקציה סגורה"}
          </span>
        </div>
        {push.subscribed ? (
          <Button variant="outline" size="sm" onClick={push.unsubscribe}>
            כיבוי
          </Button>
        ) : (
          <Button size="sm" onClick={push.subscribe}>
            הפעלת התראות
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
