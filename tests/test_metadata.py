#!/usr/bin/env python3
import json
import os
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

REPO_ROOT = Path(__file__).resolve().parent.parent


class TestKPackageMetadata(unittest.TestCase):
    def setUp(self):
        self.metadata_path = REPO_ROOT / "metadata.json"

    def test_metadata_file_exists(self):
        self.assertTrue(self.metadata_path.is_file(), f"metadata.json does not exist at {self.metadata_path}")

    def test_metadata_structure_and_fields(self):
        self.assertTrue(self.metadata_path.is_file(), f"metadata.json not found")
        with open(self.metadata_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertIn("KPackageStructure", data)
        self.assertEqual(data["KPackageStructure"], "Plasma/Wallpaper")

        self.assertIn("KPlugin", data)
        kplugin = data["KPlugin"]
        self.assertIsInstance(kplugin, dict)

        self.assertEqual(kplugin.get("Id"), "org.kde.plasma.dynamicwallpaper")
        self.assertEqual(kplugin.get("Name"), "Dynamic Wallpaper")
        self.assertTrue(kplugin.get("Description"))
        self.assertTrue(kplugin.get("Authors"))


class TestKConfigSchema(unittest.TestCase):
    def setUp(self):
        self.config_path = REPO_ROOT / "contents" / "config" / "main.xml"

    def test_main_xml_exists(self):
        self.assertTrue(self.config_path.is_file(), f"main.xml does not exist at {self.config_path}")

    def test_main_xml_schema_and_entries(self):
        self.assertTrue(self.config_path.is_file(), f"main.xml not found")
        tree = ET.parse(self.config_path)
        root = tree.getroot()

        # Handle XML namespaces if present
        def strip_ns(tag):
            return tag.split("}", 1)[1] if "}" in tag else tag

        self.assertEqual(strip_ns(root.tag), "kcfg")

        # Find group General
        groups = [elem for elem in root.iter() if strip_ns(elem.tag) == "group" and elem.get("name") == "General"]
        self.assertEqual(len(groups), 1, "Expected exactly one <group name='General'> in main.xml")
        general_group = groups[0]

        # Expected configuration entries and their specifications
        expected_entries = {
            "folderPath": {"type": "String", "default": ""},
            "imageDawn": {"type": "String", "default": ""},
            "imageDay": {"type": "String", "default": ""},
            "imageSunset": {"type": "String", "default": ""},
            "imageNight": {"type": "String", "default": ""},
            "latitude": {"type": "Double", "default": "0.0"},
            "longitude": {"type": "Double", "default": "0.0"},
            "transitionDuration": {"type": "Int", "default": "1500"},
        }

        found_entries = {}
        for child in general_group:
            if strip_ns(child.tag) == "entry":
                name = child.get("name")
                entry_type = child.get("type")
                default_elem = child.find("{*}default") if child.find("{*}default") is not None else child.find("default")
                default_val = default_elem.text.strip() if (default_elem is not None and default_elem.text) else ""
                found_entries[name] = {
                    "type": entry_type,
                    "default": default_val,
                }

        self.assertEqual(
            set(found_entries.keys()),
            set(expected_entries.keys()),
            f"Config entries mismatch: found {list(found_entries.keys())}, expected {list(expected_entries.keys())}",
        )

        for name, spec in expected_entries.items():
            entry = found_entries[name]
            self.assertEqual(
                entry["type"],
                spec["type"],
                f"Entry {name} type mismatch: expected {spec['type']}, got {entry['type']}",
            )
            self.assertEqual(
                entry["default"],
                spec["default"],
                f"Entry {name} default mismatch: expected '{spec['default']}', got '{entry['default']}'",
            )


if __name__ == "__main__":
    unittest.main()
