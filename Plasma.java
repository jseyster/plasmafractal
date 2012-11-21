/* Simple plasma fractal implementation. 
 *
 * Justin Seyster, 2002
 *
 * Permission is granted by the author to use the source code provided
 * in this file for any purpose, on its own or as part of a derivative
 * work, and with no restrictions.  Enjoy!
 */

import java.applet.Applet;
import java.awt.*;

public class Plasma extends Applet
{

	Image Buffer;	//A buffer used to store the image
	Graphics Context;	//Used to draw to the buffer.
	
	//Randomly displaces color value for midpoint depending on size
	//of grid piece.
	float Displace(float num)
	{
		float max = num / (float)(getSize().width + getSize().height) * 3;
		return ((float)Math.random() - 0.5f) * max;
	}

	//Returns a color based on a color value, c.
	Color ComputeColor(float c)
	{		
		float Red = 0;
		float Green = 0;
		float Blue = 0;
		
		if (c < 0.5f)
		{
			Red = c * 2;
		}
		else
		{
			Red = (1.0f - c) * 2;
		}
		
		if (c >= 0.3f && c < 0.8f)
		{
			Green = (c - 0.3f) * 2;
		}
		else if (c < 0.3f)
		{
			Green = (0.3f - c) * 2;
		}
		else
		{
			Green = (1.3f - c) * 2;
		}
		
		if (c >= 0.5f)
		{
			Blue = (c - 0.5f) * 2;
		}
		else
		{
			Blue = (0.5f - c) * 2;
		}
		
		return new Color(Red, Green, Blue);
	}
	
	//This is something of a "helper function" to create an initial grid
	//before the recursive function is called.	
	void drawPlasma(Graphics g, int width, int height)
	{
		float c1, c2, c3, c4;
		
		//Assign the four corners of the intial grid random color values
		//These will end up being the colors of the four corners of the applet.		
		c1 = (float)Math.random();
		c2 = (float)Math.random();
		c3 = (float)Math.random();
		c4 = (float)Math.random();
				
		DivideGrid(g, 0, 0, width , height , c1, c2, c3, c4);
	}
	
	//This is the recursive function that implements the random midpoint
	//displacement algorithm.  It will call itself until the grid pieces
	//become smaller than one pixel.	
	void DivideGrid(Graphics g, float x, float y, float width, float height, float c1, float c2, float c3, float c4)
	{
		float Edge1, Edge2, Edge3, Edge4, Middle;
		float newWidth = width / 2;
		float newHeight = height / 2;

		if (width > 2 || height > 2)
		{	
			Middle = (c1 + c2 + c3 + c4) / 4 + Displace(newWidth + newHeight);	//Randomly displace the midpoint!
			Edge1 = (c1 + c2) / 2;	//Calculate the edges by averaging the two corners of each edge.
			Edge2 = (c2 + c3) / 2;
			Edge3 = (c3 + c4) / 2;
			Edge4 = (c4 + c1) / 2;
			
			//Make sure that the midpoint doesn't accidentally "randomly displaced" past the boundaries!
			if (Middle < 0)
			{
				Middle = 0;
			}
			else if (Middle > 1.0f)
			{
				Middle = 1.0f;
			}
			
			//Do the operation over again for each of the four new grids.			
			DivideGrid(g, x, y, newWidth, newHeight, c1, Edge1, Middle, Edge4);
			DivideGrid(g, x + newWidth, y, newWidth, newHeight, Edge1, c2, Edge2, Middle);
			DivideGrid(g, x + newWidth, y + newHeight, newWidth, newHeight, Middle, Edge2, c3, Edge3);
			DivideGrid(g, x, y + newHeight, newWidth, newHeight, Edge4, Middle, Edge3, c4);
		}
		else	//This is the "base case," where each grid piece is less than the size of a pixel.
		{
			//The four corners of the grid piece will be averaged and drawn as a single pixel.
			float c = (c1 + c2 + c3 + c4) / 4;
			
			g.setColor(ComputeColor(c));
			g.drawRect((int)x, (int)y, 1, 1);	//Java doesn't have a function to draw a single pixel, so
								//a 1 by 1 rectangle is used.
		}
	}

	//Draw a new plasma fractal whenever the applet is clicked.
	public boolean mouseUp(Event evt, int x, int y)
	{
		drawPlasma(Context, getSize().width, getSize().height);
		repaint();	//Force the applet to draw the new plasma fractal.
		
		return false;
	}
	
	//Whenever something temporarily obscures the applet, it must be redrawn manually.
	//Since the fractal is stored in an offscreen buffer, this function only needs to
	//draw the buffer to the screen again.
	public void paint(Graphics g)
	{
		g.drawImage(Buffer, 0, 0, this);
	}
	
	public String getAppletInfo()
	{
		return "Plasma Fractal.  Written January, 2002 by Justin Seyster.";
	}
	
	public void init()
	{
		Buffer = createImage(getSize().width, getSize().height);	//Set up the graphics buffer and context.
		Context = Buffer.getGraphics();
		drawPlasma(Context, getSize().width, getSize().height);	//Draw the first plasma fractal.
	}
};
