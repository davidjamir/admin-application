import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Shuffle } from "lucide-react"
import { COUNTRY_CODES } from "@/hooks/usePageEdit"

interface ContactFieldsProps {
  countryCode: string
  setCountryCode: (val: string) => void
  phoneNumber: string
  handlePhoneChange: (val: string) => void
  handleRandomPhone: () => void
  email: string
  setEmail: (val: string) => void
  domains: string[]
  selectedDomain: string
  handleDomainSelect: (val: string) => void
}

export function ContactFields({
  countryCode, setCountryCode, phoneNumber, handlePhoneChange, handleRandomPhone,
  email, setEmail, domains, selectedDomain, handleDomainSelect
}: ContactFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-[13px] font-semibold text-muted-foreground/80">Phone</Label>
        <div className="flex gap-2">
          <Select value={countryCode} onValueChange={setCountryCode}>
            <SelectTrigger className="w-[120px] h-10 px-3 py-0 rounded-lg bg-background/50 text-sm flex items-center">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>{COUNTRY_CODES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
          <Input id="phone" value={phoneNumber} onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Number" className="flex-1 h-10 px-3 rounded-lg bg-background/50 font-mono text-sm" />
          <Button 
            type="button" 
            variant="outline" 
            size="icon" 
            onClick={handleRandomPhone}
            className="h-10 w-10 bg-primary/5 hover:bg-primary/10 border-primary/20 rounded-lg group"
          >
            <Shuffle className="w-4 h-4 text-primary transition-all group-hover:scale-110" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-[13px] font-semibold text-muted-foreground/80">Email</Label>
        <div className="flex gap-2">
          <Input id="email" value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" className="flex-1 h-10 px-3 rounded-lg bg-background/50 font-mono text-sm" />
          <Select value={selectedDomain} onValueChange={handleDomainSelect}>
            <SelectTrigger className="w-[140px] h-10 px-3 py-0 rounded-lg bg-background/50 text-sm font-medium flex items-center">
              <SelectValue placeholder="domain" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="original" className="font-bold text-primary">Original</SelectItem>
              {domains.map(d => <SelectItem key={d} value={d} className="font-mono text-sm">{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
