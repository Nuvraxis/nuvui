"use client";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  NativeSelect,
  Slider,
  Switch,
} from "@nuvui/react";
import { useState } from "react";

export default function Example() {
  const [volume, setVolume] = useState([60]);

  return (
    <div style={{ inlineSize: "100%", maxInlineSize: "32rem" }}>
      <h4 id="item-settings-heading" style={{ margin: "0 0 0.5rem" }}>
        Notifications
      </h4>
      <ItemGroup variant="outline" aria-labelledby="item-settings-heading">
        <Item>
          <ItemContent>
            <ItemTitle id="item-settings-digest">Weekly digest</ItemTitle>
            <ItemDescription id="item-settings-digest-text">
              A summary of your team's week, every Monday.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Switch
              defaultChecked
              aria-labelledby="item-settings-digest"
              aria-describedby="item-settings-digest-text"
            />
          </ItemActions>
        </Item>
        <Item>
          <ItemContent>
            <ItemTitle id="item-settings-mentions">Mentions</ItemTitle>
            <ItemDescription>Where to tell you about them.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <NativeSelect
              defaultValue="email"
              aria-labelledby="item-settings-mentions"
            >
              <option value="email">Email</option>
              <option value="push">Push</option>
              <option value="none">Nowhere</option>
            </NativeSelect>
          </ItemActions>
        </Item>
        <Item>
          <ItemContent>
            <ItemTitle id="item-settings-volume">Alert volume</ItemTitle>
            <ItemDescription>{volume[0]}%</ItemDescription>
          </ItemContent>
          <ItemActions style={{ inlineSize: "9rem" }}>
            <Slider
              value={volume}
              onValueChange={setVolume}
              step={10}
              aria-labelledby="item-settings-volume"
            />
          </ItemActions>
        </Item>
      </ItemGroup>
    </div>
  );
}
