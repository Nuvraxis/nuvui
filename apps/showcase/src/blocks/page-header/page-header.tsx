import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from "@nuvui/react";
import { Download, Plus } from "lucide-react";
import "./page-header.scss";

const facts = [
  { label: "Customer since", value: "March 2021" },
  { label: "Plan", value: "Business, yearly" },
  { label: "Account owner", value: "Ada Lovelace" },
];

export default function PageHeader() {
  return (
    <header className="page-header">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#home">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#customers">Customers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Northwind Traders</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="page-header__row">
        <div className="page-header__about">
          <div className="page-header__heading">
            <h1 className="page-header__title">Northwind Traders</h1>
            <Badge intent="success" variant="outline">
              Active
            </Badge>
          </div>
          <p className="page-header__text">
            Wholesale customer with 42 orders this year. The figures on this
            page are for the last twelve months.
          </p>
        </div>
        <div className="page-header__actions">
          <Button intent="secondary">
            <Download aria-hidden="true" size={16} />
            Export
          </Button>
          <Button>
            <Plus aria-hidden="true" size={16} />
            New order
          </Button>
        </div>
      </div>
      <dl className="page-header__facts">
        {facts.map((fact) => (
          <div key={fact.label} className="page-header__fact">
            <dt className="page-header__label">{fact.label}</dt>
            <dd className="page-header__value">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
