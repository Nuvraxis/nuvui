"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  type Direction,
  DirectionProvider,
  Progress,
  Slider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [dir, setDir] = useState<Direction>("rtl");

  return (
    <div style={{ display: "grid", gap: 16, width: "100%", maxWidth: 360 }}>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        aria-label="Direction"
        value={dir}
        onValueChange={(value) => value && setDir(value as Direction)}
      >
        <ToggleGroupItem value="ltr">Left to right</ToggleGroupItem>
        <ToggleGroupItem value="rtl">Right to left</ToggleGroupItem>
      </ToggleGroup>

      {/* In an app both of these go at the top: the attribute on <html>, and
          the provider around everything. */}
      <DirectionProvider dir={dir}>
        <div dir={dir} style={{ display: "grid", gap: 16 }}>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">الرئيسية</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>الإعدادات</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Tabs defaultValue="first">
            <TabsList aria-label="Sections">
              <TabsTrigger value="first">الأول</TabsTrigger>
              <TabsTrigger value="second">الثاني</TabsTrigger>
              <TabsTrigger value="third">الثالث</TabsTrigger>
            </TabsList>
            <TabsContent value="first">المحتوى الأول</TabsContent>
            <TabsContent value="second">المحتوى الثاني</TabsContent>
            <TabsContent value="third">المحتوى الثالث</TabsContent>
          </Tabs>
          <Slider aria-label="Volume" defaultValue={[25]} />
          <Progress aria-label="Upload" value={25} />
        </div>
      </DirectionProvider>
    </div>
  );
}
