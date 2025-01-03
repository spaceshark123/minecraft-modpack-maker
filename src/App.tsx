//import { useState } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import EditableList from './EditableList'

function App() {
  return (
    <>
      <Card className='pr-10 pl-10 min-w-[30vw]'>
        <CardHeader>
          <CardTitle className='text-xl'>Minecraft Modpack Maker</CardTitle>
          <CardDescription>Easily download a bunch of mods</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="mods-input">Mods</Label>
                <EditableList id="mods-input" placeholder='Paste your mods here...'/>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="framework">Mod Loader</Label>
                <Select>
                  <SelectTrigger id="framework">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="forge">Forge</SelectItem>
                    <SelectItem value="fabric">Fabric</SelectItem>
                    <SelectItem value="neoforge">NeoForge</SelectItem>
                    <SelectItem value="quilt">Quilt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type='submit' variant='secondary' className='w-full'>Construct Modpack</Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className=''>
          <p className='text-sm text-gray-500'>
            Made by Spaceshark
          </p>
        </CardFooter>
      </Card>
    </>
  )
}

export default App
