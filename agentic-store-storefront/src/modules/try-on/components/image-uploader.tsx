"use client"
import { useState, useRef } from "react"
import { Button } from "@medusajs/ui"

type Props = {
  promptText: string
  onImageChange: (base64: string | null) => void
}

export default function ImageUploader({ promptText, onImageChange }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setPreview(base64)
      onImageChange(base64)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-4 items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
      <p className="text-sm font-medium text-gray-700">{promptText}</p>
      
      {preview ? (
        <div className="relative w-48 h-64">
          <img src={preview} alt="Upload preview" className="w-full h-full object-cover rounded-md shadow-sm" />
          <Button 
            size="small" 
            variant="secondary" 
            className="absolute -top-3 -right-3 rounded-full shadow-md"
            onClick={() => { setPreview(null); onImageChange(null); if(inputRef.current) inputRef.current.value = ""; }}
          >
            ✕
          </Button>
        </div>
      ) : (
        <Button onClick={() => inputRef.current?.click()}>Choose Image</Button>
      )}
      
      <input 
        type="file" 
        accept="image/*" 
        ref={inputRef} 
        onChange={handleFile} 
        className="hidden" 
      />
    </div>
  )
}