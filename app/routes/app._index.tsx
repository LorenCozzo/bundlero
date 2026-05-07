import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { redirect, useLoaderData, useFetcher } from "react-router";
import { authenticate, ensureAutomaticDiscount } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  await ensureAutomaticDiscount(admin).catch((e) => console.error("[bundlero] loader discount error:", e));
  const bundles = await db.quantityBundle.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      isActive: true,
      applyTo: true,
      createdAt: true,
    },
  });
  return { bundles, shop: session.shop };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("_action") as string;
  const id = formData.get("id") as string;

  if (intent === "create") {
    const bundle = await db.quantityBundle.create({
      data: { shop: session.shop, name: "New bundle" },
    });
    return redirect(`/app/bundles/${bundle.id}`);
  }

  if (intent === "toggle") {
    const bundle = await db.quantityBundle.findFirst({
      where: { id, shop: session.shop },
      select: { isActive: true },
    });
    if (bundle) {
      await db.quantityBundle.update({
        where: { id },
        data: { isActive: !bundle.isActive },
      });
    }
    return null;
  }

  if (intent === "delete") {
    await db.quantityBundle.deleteMany({ where: { id, shop: session.shop } });
    return null;
  }

  return null;
};

type Bundle = Awaited<ReturnType<typeof loader>>["bundles"][number];

function BundleRow({ bundle }: { bundle: Bundle }) {
  const toggleFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const isActive =
    toggleFetcher.state !== "idle" ? !bundle.isActive : bundle.isActive;

  if (deleteFetcher.state !== "idle") return null;

  return (
    <s-box padding="base" border-width="base" border-radius="base">
      <s-stack direction="inline" gap="base">
        <s-stack direction="block" gap="base">
          <s-link href={`/app/bundles/${bundle.id}`}>
            {bundle.name}
          </s-link>
          <s-stack direction="inline" gap="base">
            <s-badge tone={bundle.applyTo === "ALL" ? "info" : "neutral"}>
              {bundle.applyTo === "ALL" ? "All products" : "Specific product"}
            </s-badge>
            <s-badge tone={isActive ? "success" : "neutral"}>
              {isActive ? "Active" : "Inactive"}
            </s-badge>
          </s-stack>
        </s-stack>

        <s-stack direction="inline" gap="base">
          <s-button
            variant="secondary"
            onClick={() => { window.location.href = `/app/bundles/${bundle.id}`; }}
          >
            Edit
          </s-button>

          <s-button
            variant="secondary"
            onClick={() =>
              toggleFetcher.submit(
                { _action: "toggle", id: bundle.id },
                { method: "post" },
              )
            }
          >
            {isActive ? "Deactivate" : "Activate"}
          </s-button>

          <s-button
            variant="secondary"
            tone="critical"
            onClick={() =>
              deleteFetcher.submit(
                { _action: "delete", id: bundle.id },
                { method: "post" },
              )
            }
          >
            Delete
          </s-button>
        </s-stack>
      </s-stack>
    </s-box>
  );
}

export default function BundleList() {
  const { bundles, shop } = useLoaderData<typeof loader>();
  const createFetcher = useFetcher();

  const handleCreate = () =>
    createFetcher.submit({ _action: "create" }, { method: "post" });

  const themeEditorUrl = `https://${shop}/admin/themes/current/editor?context=apps`;

  return (
    <s-page heading="Bundles">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={handleCreate}
        {...(createFetcher.state !== "idle" ? { loading: true } : {})}
      >
        Create bundle
      </s-button>

      <s-section heading="Setup">
        <s-stack direction="block" gap="base">
          <s-text>
            Enable the Quantity Breaks widget in your theme to show offers on product pages.
          </s-text>
          <s-button
            variant="secondary"
            onClick={() => window.open(themeEditorUrl, "_blank")}
          >
            Enable widget in theme →
          </s-button>
        </s-stack>
      </s-section>

      <s-section heading="Your bundles">
        {bundles.length === 0 ? (
          <s-stack direction="block" gap="base">
            <s-text>No bundles yet. Create your first one to get started.</s-text>
            <s-button variant="primary" onClick={handleCreate}>
              Create bundle
            </s-button>
          </s-stack>
        ) : (
          <s-stack direction="block" gap="base">
            {bundles.map((bundle) => (
              <BundleRow key={bundle.id} bundle={bundle} />
            ))}
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
