import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Textarea } from "./ui/textarea";

export default function UploadPhoto() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [photoDate, setPhotoDate] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const upload = async () => {
    if (!file) return;
    if (!photoDate) {
      alert("Огноо оруулна уу");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("note", note);
    formData.append("photoDate", photoDate);

    const res = await fetch("/api/upload", { method: "POST", body: formData });

    if (!res.ok) {
      alert("Upload амжилтгүй");
      setIsLoading(false);
      return;
    }

    alert("Амжилттай!");
    setFile(null);
    setNote("");
    setPhotoDate(undefined);
    setIsLoading(false);
  };

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col *:md:flex-row gap-4 p-4">
          <Textarea
            placeholder="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="border"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                data-empty={!photoDate}
                className="w-[280px] justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
              >
                <CalendarIcon />
                {photoDate ? format(photoDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Input
                type="date"
                value={photoDate}
                onChange={(e) => setPhotoDate(e.target.value)}
                className="border p-2"
              />
            </PopoverContent>
          </Popover>
          <Input
            type="file"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (e.target.files) setFile(e.target.files[0]);
            }}
          />
        </div>
      </CardContent>
      <Button onClick={upload} disabled={isLoading}>
        {isLoading ? "Uploading..." : "Upload"}
      </Button>
    </Card>
  );
}
