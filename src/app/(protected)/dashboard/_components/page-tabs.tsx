"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryState } from "nuqs";
import React from "react";

export const dataDashboard = ["Categorys", "Users", "Packages"] as const;

const PageTabs: React.FC<{ children: React.ReactNode; className: string }> = ({
  children,
  className = "",
}) => {
  const [data, setData] = useQueryState("data", { defaultValue: "categorys" });

  return (
    <div className={className}>
      <Tabs
        value={data}
        onValueChange={(val) => setData(val)}
        className="flex w-full flex-col justify-start gap-6"
      >
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={data} onValueChange={(val) => setData(val)}>
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            {dataDashboard.map((value, idx) => (
              <SelectItem value={value.toLowerCase()} key={`${value}-${idx}`}>
                {value}
              </SelectItem>
            ))}

            <SelectItem value="key-personnel">Key Personnel</SelectItem>
            <SelectItem value="focus-documents">Focus Documents</SelectItem>
          </SelectContent>
        </Select>

        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="categorys">Categorys</TabsTrigger>
          <TabsTrigger value="users" className="gap-1">
            Users
          </TabsTrigger>
        </TabsList>

        {children}
      </Tabs>
    </div>
  );
};

export default PageTabs;
