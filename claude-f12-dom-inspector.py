#!/usr/bin/env python3
"""
Claude F12 DOM Inspector - Live DOM analysis tool
First principles approach to finding artifact download mechanism
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
import time
import json
from datetime import datetime

class ClaudeArtifactInspector:
    def __init__(self):
        self.driver = None
        self.findings = []
        
    def setup_browser(self):
        """Setup Chrome with debugging capabilities"""
        options = webdriver.ChromeOptions()
        options.add_argument('--start-maximized')
        options.add_experimental_option('excludeSwitches', ['enable-automation'])
        options.add_experimental_option('useAutomationExtension', False)
        
        self.driver = webdriver.Chrome(options=options)
        print("✅ Browser started. Please log into Claude.ai manually.")
        
    def wait_for_login(self):
        """Wait for user to login and navigate to a conversation with artifacts"""
        input("\n⏸️  Please:\n1. Log into Claude.ai\n2. Navigate to a conversation WITH artifacts\n3. Press ENTER when ready...")
        time.sleep(2)
        
    def find_artifact_buttons(self):
        """Find all artifact preview buttons"""
        try:
            buttons = self.driver.find_elements(By.CSS_SELECTOR, 'button[aria-label="Preview contents"]')
            print(f"\n📦 Found {len(buttons)} artifact buttons")
            return buttons
        except Exception as e:
            print(f"❌ Error finding artifact buttons: {e}")
            return []
            
    def inspect_artifact_panel(self, button_index=0):
        """Click artifact and inspect the opened panel"""
        buttons = self.find_artifact_buttons()
        if button_index >= len(buttons):
            print(f"❌ No button at index {button_index}")
            return
            
        print(f"\n🔍 Inspecting artifact {button_index + 1}/{len(buttons)}")
        
        # Click the artifact button
        buttons[button_index].click()
        time.sleep(2)
        
        # Find the artifact panel
        panels = self.driver.find_elements(By.CSS_SELECTOR, '[class*="basis-0"]')
        if not panels:
            panels = self.driver.find_elements(By.XPATH, '/html/body/div[4]/div[2]/div/div[3]')
            
        if panels:
            panel = panels[0]
            print(f"✅ Found artifact panel")
            
            # Inspect all buttons in the panel
            panel_buttons = panel.find_elements(By.TAG_NAME, 'button')
            print(f"   Found {len(panel_buttons)} buttons in panel:")
            
            for i, btn in enumerate(panel_buttons):
                btn_id = btn.get_attribute('id') or 'no-id'
                btn_text = btn.text.strip() or 'no-text'
                btn_aria = btn.get_attribute('aria-label') or 'no-aria-label'
                
                # Check for SVG
                svgs = btn.find_elements(By.TAG_NAME, 'svg')
                has_svg = len(svgs) > 0
                
                print(f"   Button {i}: id='{btn_id}', text='{btn_text}', aria='{btn_aria}', svg={has_svg}")
                
                # If it looks like a dropdown button, inspect it
                if has_svg and i > 0:  # Usually dropdown is after Copy button
                    self.inspect_dropdown(btn, panel)
                    
        else:
            print("❌ Artifact panel not found")
            
    def inspect_dropdown(self, dropdown_btn, panel):
        """Click dropdown and inspect what appears"""
        print(f"\n🎯 Clicking dropdown button: {dropdown_btn.get_attribute('id')}")
        
        # Get initial DOM state
        initial_body_children = len(self.driver.find_element(By.TAG_NAME, 'body').find_elements(By.XPATH, './div'))
        
        # Click dropdown
        dropdown_btn.click()
        time.sleep(1)
        
        # Check for new elements
        final_body_children = len(self.driver.find_element(By.TAG_NAME, 'body').find_elements(By.XPATH, './div'))
        
        print(f"   Body > div count: {initial_body_children} → {final_body_children}")
        
        # Look for dropdown menu in various locations
        self.inspect_dropdown_locations()
        
    def inspect_dropdown_locations(self):
        """Inspect all possible dropdown menu locations"""
        print("\n📍 Searching for dropdown menu:")
        
        # 1. Check body > div elements
        body_divs = self.driver.find_elements(By.XPATH, '/html/body/div')
        print(f"   Body has {len(body_divs)} direct div children")
        
        for i, div in enumerate(body_divs[-5:]):  # Check last 5 divs
            # Look for links in this div
            links = div.find_elements(By.TAG_NAME, 'a')
            if links:
                print(f"\n   ✅ Found links in body > div[{i+1}]:")
                for link in links:
                    href = link.get_attribute('href') or ''
                    text = link.text.strip()
                    download = link.get_attribute('download') or ''
                    print(f"      Link: text='{text}', href='{href[:50]}...', download='{download}'")
                    
                    # Record successful pattern
                    if 'blob:' in href or download:
                        self.findings.append({
                            'type': 'download_link',
                            'location': f'body > div[{i+1}] > a',
                            'text': text,
                            'download_attr': download
                        })
        
        # 2. Check for radix content
        radix_elements = self.driver.find_elements(By.CSS_SELECTOR, '[id^="radix-"]')
        radix_with_links = [elem for elem in radix_elements if elem.find_elements(By.TAG_NAME, 'a')]
        
        if radix_with_links:
            print(f"\n   Found {len(radix_with_links)} radix elements with links")
            for elem in radix_with_links[:3]:
                elem_id = elem.get_attribute('id')
                links = elem.find_elements(By.TAG_NAME, 'a')
                print(f"   Radix element {elem_id} has {len(links)} links")
                
        # 3. Check for role="menu"
        menus = self.driver.find_elements(By.CSS_SELECTOR, '[role="menu"]')
        if menus:
            print(f"\n   Found {len(menus)} elements with role='menu'")
            
    def close_panel(self):
        """Close the artifact panel"""
        try:
            close_btn = self.driver.find_element(By.CSS_SELECTOR, 'button[aria-label="Close"]')
            close_btn.click()
        except:
            # Click body to close
            self.driver.find_element(By.TAG_NAME, 'body').click()
        time.sleep(1)
        
    def save_findings(self):
        """Save inspection findings"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'url': self.driver.current_url,
            'findings': self.findings,
            'summary': {
                'artifact_selector': 'button[aria-label="Preview contents"]',
                'panel_selector': '[class*="basis-0"] or /html/body/div[4]/div[2]/div/div[3]',
                'dropdown_button': 'Second button with radix ID and SVG in panel',
                'download_link_location': 'body > div[N] > a (where N is one of the last few divs)',
                'download_link_attributes': 'href contains "blob:" and has download attribute'
            }
        }
        
        with open('claude-dom-inspection-report.json', 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"\n💾 Saved findings to claude-dom-inspection-report.json")
        
    def run(self):
        """Run the full inspection"""
        try:
            self.setup_browser()
            self.wait_for_login()
            
            buttons = self.find_artifact_buttons()
            if buttons:
                # Inspect first artifact
                self.inspect_artifact_panel(0)
                self.close_panel()
                
                # If there are more artifacts, inspect another
                if len(buttons) > 1:
                    time.sleep(1)
                    self.inspect_artifact_panel(1)
                    self.close_panel()
                    
            self.save_findings()
            
            input("\n⏸️  Inspection complete. Press ENTER to close browser...")
            
        finally:
            if self.driver:
                self.driver.quit()

if __name__ == "__main__":
    print("🔬 Claude F12 DOM Inspector")
    print("=" * 50)
    
    inspector = ClaudeArtifactInspector()
    inspector.run()