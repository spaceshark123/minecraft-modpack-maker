import { useState, useEffect} from 'react'
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
import ModLoaderChooser from './ModLoaderChooser'
import ModsInput from './ModsInput'
import VersionChooser from './VersionChooser'


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
              <ModsInput />
              <ModLoaderChooser />
              <VersionChooser />
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
